import {
  buildBlockFromSessions,
  validateBlock,
} from "./helpers/blockHelpers.js";
import { sessionsToPromptString } from "./helpers/promptFormat.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { EMPTY_TOKEN_USAGE, mergeTokenUsage } from "./llm/client.js";
import { runLLMWithJsonMode } from "./llm/runLlm.js";
import {
  buildInitialGroupingUserPrompt,
  INITIAL_GROUPING_SYSTEM_PROMPT,
} from "./prompts/initialGrouping.js";
import { initialGroupingResponseSchema } from "./schemas/llmOutputs.js";
import type { SessionTraceCollector } from "./sessionTrace.js";
import type {
  Block,
  BlockingLogger,
  Session,
  StageMetadata,
  TokenUsage,
} from "./types.js";

const MAX_SESSIONS_PER_CALL = 32;
const MAX_PASSES = 2;

export type ReconciliationResult = {
  blocks: Block[];
  assignedIds: Set<string>;
  stages: StageMetadata[];
};

function defaultLogger(): BlockingLogger {
  return { info: () => {}, warn: () => {} };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function hydrateReconciledBlocks(
  rawBlocks: Array<{
    sessionIds: string[];
    primaryDiscipline: string;
    rationale: string;
  }>,
  sessionById: Map<string, Session>,
  assignedIds: Set<string>,
  traces: SessionTraceCollector | undefined,
  logger: BlockingLogger,
): Block[] {
  const blocks: Block[] = [];

  for (const raw of rawBlocks) {
    const sessions: Session[] = [];
    for (const id of raw.sessionIds) {
      if (assignedIds.has(id)) continue;
      const session = sessionById.get(id);
      if (!session) continue;
      sessions.push(session);
      assignedIds.add(id);
    }

    if (sessions.length === 0) continue;

    const block = buildBlockFromSessions(
      sessions,
      raw.primaryDiscipline,
      raw.rationale,
    );
    const validation = validateBlock(block);
    if (!validation.valid) {
      for (const session of sessions) assignedIds.delete(session.id);
      logger.warn("reconciliation block invalid", { errors: validation.errors });
      continue;
    }

    for (const session of sessions) {
      traces?.recordReconciliation(session, block.id, raw.rationale);
    }
    blocks.push(block);
  }

  return blocks;
}

/**
 * Places remaining unassigned sessions into new blocks via batched LLM calls.
 */
export async function runReconciliation(
  unassigned: Session[],
  assignedIds: Set<string>,
  sessionById: Map<string, Session>,
  client: BlockingLLMClient,
  traces?: SessionTraceCollector,
  logger: BlockingLogger = defaultLogger(),
): Promise<ReconciliationResult> {
  const stages: StageMetadata[] = [];
  const newBlocks: Block[] = [];
  let remaining = unassigned.filter((s) => !assignedIds.has(s.id));

  for (let pass = 0; pass < MAX_PASSES && remaining.length > 0; pass++) {
    const start = Date.now();
    let usage: TokenUsage = { ...EMPTY_TOKEN_USAGE };
    const passBlocks: Block[] = [];

    for (const chunk of chunkArray(remaining, MAX_SESSIONS_PER_CALL)) {
      const discipline =
        chunk[0]?.primaryDiscipline ?? chunk[0]?.disciplines[0] ?? "general";
      const result = await runLLMWithJsonMode(client, {
        system:
          INITIAL_GROUPING_SYSTEM_PROMPT +
          "\n\nThese sessions were not placed yet. Every session id listed must appear in exactly one block.",
        prompt: buildInitialGroupingUserPrompt(
          discipline,
          sessionsToPromptString(chunk),
        ),
        schema: initialGroupingResponseSchema,
        temperature: 0.4,
      });
      usage = mergeTokenUsage(usage, result.usage);

      passBlocks.push(
        ...hydrateReconciledBlocks(
          result.object.blocks,
          sessionById,
          assignedIds,
          traces,
          logger,
        ),
      );
    }

    newBlocks.push(...passBlocks);
    remaining = remaining.filter((s) => !assignedIds.has(s.id));

    stages.push({
      name: `reconciliation_pass_${pass + 1}`,
      durationMs: Date.now() - start,
      usage,
      details: {
        placed: passBlocks.reduce((n, b) => n + b.sessions.length, 0),
        remaining: remaining.length,
      },
    });

    if (remaining.length === 0) break;
  }

  traces?.recordUnassigned(remaining);

  return { blocks: newBlocks, assignedIds, stages };
}
