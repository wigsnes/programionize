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
  DisciplinePool,
  Session,
  StageMetadata,
  TokenUsage,
} from "./types.js";

const MAX_SESSIONS_PER_CALL = 32;

export type InitialGroupingResult = {
  blocks: Block[];
  assignedIds: Set<string>;
  stage: StageMetadata;
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

function hydrateBlocks(
  rawBlocks: Array<{
    sessionIds: string[];
    primaryDiscipline: string;
    rationale: string;
  }>,
  sessionById: Map<string, Session>,
  assignedIds: Set<string>,
  logger: BlockingLogger,
  traces?: SessionTraceCollector,
  poolId?: string,
): Block[] {
  const blocks: Block[] = [];

  for (const raw of rawBlocks) {
    const sessions: Session[] = [];
    for (const id of raw.sessionIds) {
      if (assignedIds.has(id)) {
        logger.warn("duplicate session assignment skipped", { sessionId: id });
        continue;
      }
      const session = sessionById.get(id);
      if (!session) {
        logger.warn("unknown session id in LLM output", { sessionId: id });
        continue;
      }
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
      logger.warn("invalid block from LLM", {
        errors: validation.errors,
        sessionIds: sessions.map((s) => s.id),
      });
      for (const session of sessions) {
        assignedIds.delete(session.id);
      }
      continue;
    }

    blocks.push(block);
    for (const session of sessions) {
      traces?.recordGrouping(session, block.id, raw.rationale, poolId ?? raw.primaryDiscipline);
    }
  }

  return blocks;
}

/**
 * Phase 1: initial AI grouping per discipline pool in chunks of ≤32 sessions.
 */
export async function runInitialGrouping(
  pools: DisciplinePool[],
  sessionById: Map<string, Session>,
  client: BlockingLLMClient,
  logger: BlockingLogger = defaultLogger(),
  traces?: SessionTraceCollector,
): Promise<InitialGroupingResult> {
  const start = Date.now();
  let usage: TokenUsage = { ...EMPTY_TOKEN_USAGE };
  const assignedIds = new Set<string>();
  const blocks: Block[] = [];

  for (const pool of pools) {
    for (const chunk of chunkArray(pool.sessions, MAX_SESSIONS_PER_CALL)) {
      const result = await runLLMWithJsonMode(client, {
        system: INITIAL_GROUPING_SYSTEM_PROMPT,
        prompt: buildInitialGroupingUserPrompt(
          pool.primaryDiscipline,
          sessionsToPromptString(chunk),
        ),
        schema: initialGroupingResponseSchema,
        temperature: 0.4,
      });
      usage = mergeTokenUsage(usage, result.usage);

      blocks.push(
        ...hydrateBlocks(
          result.object.blocks,
          sessionById,
          assignedIds,
          logger,
          traces,
          pool.poolId,
        ),
      );
    }
  }

  return {
    blocks,
    assignedIds,
    stage: {
      name: "initialGrouping",
      durationMs: Date.now() - start,
      usage,
      details: { blockCount: blocks.length },
    },
  };
}

export function collectUnassigned(
  allSessions: Session[],
  assignedIds: Set<string>,
): Session[] {
  return allSessions.filter((session) => !assignedIds.has(session.id));
}

export function splitBlocksByCompleteness(blocks: Block[]): {
  partial: Block[];
  complete: Block[];
} {
  const partial: Block[] = [];
  const complete: Block[] = [];

  for (const block of blocks) {
    if (block.sessions.length <= 2) {
      partial.push(block);
    } else {
      complete.push(block);
    }
  }

  return { partial, complete };
}
