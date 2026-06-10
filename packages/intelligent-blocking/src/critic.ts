import { embedText } from "./embeddings/embedSessions.js";
import { findSimilarSessions } from "./embeddings/findSimilarSessions.js";
import {
  buildBlockFromSessions,
  validateBlock,
} from "./helpers/blockHelpers.js";
import { formatBlocksForCritic, sessionsToPromptString } from "./helpers/promptFormat.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { EMPTY_TOKEN_USAGE, mergeTokenUsage } from "./llm/client.js";
import { runLLMWithJsonMode } from "./llm/runLlm.js";
import {
  BLOCK_REGENERATION_SYSTEM_PROMPT,
  buildBlockCompletionUserPrompt,
} from "./prompts/blockCompletion.js";
import { buildCriticUserPrompt, CRITIC_SYSTEM_PROMPT } from "./prompts/critic.js";
import {
  blockCompletionResponseSchema,
  criticResponseSchema,
} from "./schemas/llmOutputs.js";
import type {
  Block,
  BlockingLogger,
  CriticFlag,
  Session,
  SessionEmbeddings,
  StageMetadata,
  TokenUsage,
} from "./types.js";

const CRITIC_BATCH_SIZE = 8;
const MIN_BLOCKS_FOR_CRITIC = 6;
const REGEN_CANDIDATE_LIMIT = 15;

export type CriticResult = {
  blocks: Block[];
  assignedIds: Set<string>;
  criticFlags: CriticFlag[];
  stage: StageMetadata | null;
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

async function regenerateFlaggedBlock(
  block: Block,
  pool: Session[],
  embeddings: SessionEmbeddings,
  assignedIds: Set<string>,
  lockedIds: Set<string>,
  client: BlockingLLMClient,
  logger: BlockingLogger,
): Promise<{ block: Block; usage: TokenUsage; regenerated: boolean }> {
  for (const session of block.sessions) {
    assignedIds.delete(session.id);
  }

  const queryEmbedding = await embedText(
    block.sessions.map((s) => s.title).join("\n"),
    client,
  );
  const candidates = findSimilarSessions(queryEmbedding, pool, embeddings, {
    limit: REGEN_CANDIDATE_LIMIT,
    excludeIds: [...assignedIds, ...lockedIds, ...block.sessions.map((s) => s.id)],
    primaryDiscipline: block.primaryDiscipline,
  }).map((entry) => entry.session);

  const allCandidates = [...block.sessions, ...candidates];
  const result = await runLLMWithJsonMode(client, {
    system: BLOCK_REGENERATION_SYSTEM_PROMPT,
    prompt: buildBlockCompletionUserPrompt(
      formatBlocksForCritic([block]),
      sessionsToPromptString(allCandidates),
    ),
    schema: blockCompletionResponseSchema,
    temperature: 0.3,
  });

  const chosenIds = new Set(block.sessions.map((s) => s.id));
  if (result.object.addSessionId) {
    chosenIds.add(result.object.addSessionId);
  }

  const sessions = allCandidates.filter((session) => chosenIds.has(session.id));
  const rebuilt = buildBlockFromSessions(
    sessions.slice(0, 3),
    block.primaryDiscipline,
    result.object.rationale,
    result.object.confidence,
  );
  rebuilt.id = block.id;

  const validation = validateBlock(rebuilt);
  if (!validation.valid) {
    for (const session of block.sessions) {
      assignedIds.add(session.id);
    }
    logger.warn("critic regeneration failed validation", {
      blockId: block.id,
      errors: validation.errors,
    });
    return { block, usage: result.usage, regenerated: false };
  }

  for (const session of rebuilt.sessions) {
    assignedIds.add(session.id);
  }

  return { block: rebuilt, usage: result.usage, regenerated: true };
}

/**
 * Phase 3: critic pass on finished blocks with targeted regeneration for flagged blocks.
 */
export async function runCriticPass(
  blocks: Block[],
  pool: Session[],
  embeddings: SessionEmbeddings,
  assignedIds: Set<string>,
  lockedIds: Set<string>,
  client: BlockingLLMClient,
  logger: BlockingLogger = defaultLogger(),
): Promise<CriticResult> {
  const finished = blocks.filter((block) => block.sessions.length >= 1);
  if (finished.length < MIN_BLOCKS_FOR_CRITIC) {
    return {
      blocks,
      assignedIds,
      criticFlags: [],
      stage: null,
    };
  }

  const start = Date.now();
  let usage: TokenUsage = { ...EMPTY_TOKEN_USAGE };
  const criticFlags: CriticFlag[] = [];
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  let workingBlocks = [...blocks];

  for (const batch of chunkArray(finished, CRITIC_BATCH_SIZE)) {
    const result = await runLLMWithJsonMode(client, {
      system: CRITIC_SYSTEM_PROMPT,
      prompt: buildCriticUserPrompt(formatBlocksForCritic(batch)),
      schema: criticResponseSchema,
      temperature: 0.3,
    });
    usage = mergeTokenUsage(usage, result.usage);

    for (const review of result.object.reviews) {
      if (review.coherent) continue;

      const block = blockById.get(review.blockId);
      if (!block) continue;

      criticFlags.push({
        blockId: review.blockId,
        issue: review.issue ?? "Incoherent block",
        suggestion: review.suggestion,
        regenerated: false,
      });

      const regen = await regenerateFlaggedBlock(
        block,
        pool,
        embeddings,
        assignedIds,
        lockedIds,
        client,
        logger,
      );
      usage = mergeTokenUsage(usage, regen.usage);

      if (regen.regenerated) {
        blockById.set(regen.block.id, regen.block);
        workingBlocks = workingBlocks.map((existing) =>
          existing.id === regen.block.id ? regen.block : existing,
        );
        const flag = criticFlags[criticFlags.length - 1];
        if (flag) flag.regenerated = true;
      }
    }
  }

  return {
    blocks: workingBlocks,
    assignedIds,
    criticFlags,
    stage: {
      name: "critic",
      durationMs: Date.now() - start,
      usage,
      details: { flaggedCount: criticFlags.length },
    },
  };
}
