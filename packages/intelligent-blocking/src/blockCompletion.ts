import { embedText } from "./embeddings/embedSessions.js";
import { findSimilarSessions } from "./embeddings/findSimilarSessions.js";
import {
  buildBlockEmbeddingText,
  buildBlockFromSessions,
  validateBlock,
} from "./helpers/blockHelpers.js";
import {
  formatBlockForPrompt,
  sessionsToPromptString,
} from "./helpers/promptFormat.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { EMPTY_TOKEN_USAGE, mergeTokenUsage } from "./llm/client.js";
import { runLLMWithJsonMode } from "./llm/runLlm.js";
import {
  BLOCK_COMPLETION_SYSTEM_PROMPT,
  buildBlockCompletionUserPrompt,
} from "./prompts/blockCompletion.js";
import { blockCompletionResponseSchema } from "./schemas/llmOutputs.js";
import type {
  Block,
  BlockingLogger,
  Session,
  SessionEmbeddings,
  StageMetadata,
  TokenUsage,
} from "./types.js";

const CANDIDATE_LIMIT = 18;
const COMPLETION_PASSES = 2;

export type BlockCompletionResult = {
  blocks: Block[];
  assignedIds: Set<string>;
  stages: StageMetadata[];
};

function defaultLogger(): BlockingLogger {
  return { info: () => {}, warn: () => {} };
}

function wouldFitBlock(block: Block, candidate: Session): boolean {
  const tentative = buildBlockFromSessions(
    [...block.sessions, candidate],
    block.primaryDiscipline,
    block.rationale,
    block.confidence,
  );
  return validateBlock(tentative).valid;
}

async function completeOneBlock(
  block: Block,
  pool: Session[],
  embeddings: SessionEmbeddings,
  assignedIds: Set<string>,
  lockedIds: Set<string>,
  client: BlockingLLMClient,
  logger: BlockingLogger,
): Promise<{ block: Block; usage: TokenUsage; changed: boolean }> {
  if (block.sessions.length >= 3) {
    return { block, usage: { ...EMPTY_TOKEN_USAGE }, changed: false };
  }

  const queryText = buildBlockEmbeddingText(block);
  const queryEmbedding = await embedText(queryText, client);
  const excludeIds = [...assignedIds, ...lockedIds];
  const candidates = findSimilarSessions(queryEmbedding, pool, embeddings, {
    limit: CANDIDATE_LIMIT,
    excludeIds,
    primaryDiscipline: block.primaryDiscipline,
  }).map((entry) => entry.session);

  if (candidates.length === 0) {
    return { block, usage: { ...EMPTY_TOKEN_USAGE }, changed: false };
  }

  const result = await runLLMWithJsonMode(client, {
    system: BLOCK_COMPLETION_SYSTEM_PROMPT,
    prompt: buildBlockCompletionUserPrompt(
      formatBlockForPrompt(block),
      sessionsToPromptString(candidates),
    ),
    schema: blockCompletionResponseSchema,
    temperature: 0.4,
  });

  const addId = result.object.addSessionId;
  if (!addId) {
    return {
      block: { ...block, confidence: result.object.confidence },
      usage: result.usage,
      changed: false,
    };
  }

  const candidate = candidates.find((session) => session.id === addId);
  if (!candidate) {
    logger.warn("completion chose unknown candidate", { addSessionId: addId });
    return { block, usage: result.usage, changed: false };
  }

  if (!wouldFitBlock(block, candidate)) {
    logger.warn("completion candidate failed validation", {
      addSessionId: addId,
    });
    return { block, usage: result.usage, changed: false };
  }

  const completed = buildBlockFromSessions(
    [...block.sessions, candidate],
    block.primaryDiscipline,
    result.object.rationale,
    result.object.confidence,
  );
  completed.id = block.id;

  assignedIds.add(candidate.id);

  return { block: completed, usage: result.usage, changed: true };
}

/**
 * Phase 2: fill partial blocks using embedding retrieval + LLM completion.
 * Runs twice so newly freed sessions can be reconsidered.
 */
export async function runBlockCompletion(
  partialBlocks: Block[],
  completeBlocks: Block[],
  pool: Session[],
  embeddings: SessionEmbeddings,
  assignedIds: Set<string>,
  lockedIds: Set<string>,
  client: BlockingLLMClient,
  logger: BlockingLogger = defaultLogger(),
): Promise<BlockCompletionResult> {
  const stages: StageMetadata[] = [];
  let workingPartial = [...partialBlocks];
  let workingComplete = [...completeBlocks];

  for (let pass = 0; pass < COMPLETION_PASSES; pass++) {
    const start = Date.now();
    let usage: TokenUsage = { ...EMPTY_TOKEN_USAGE };
    const nextPartial: Block[] = [];
    const nextComplete: Block[] = [...workingComplete];

    for (const block of workingPartial) {
      const result = await completeOneBlock(
        block,
        pool,
        embeddings,
        assignedIds,
        lockedIds,
        client,
        logger,
      );
      usage = mergeTokenUsage(usage, result.usage);

      if (result.block.sessions.length >= 3) {
        nextComplete.push(result.block);
      } else {
        nextPartial.push(result.block);
      }
    }

    stages.push({
      name: `blockCompletion_pass_${pass + 1}`,
      durationMs: Date.now() - start,
      usage,
      details: {
        partialRemaining: nextPartial.length,
        completeCount: nextComplete.length,
      },
    });

    workingPartial = nextPartial;
    workingComplete = nextComplete;
  }

  return {
    blocks: [...workingComplete, ...workingPartial],
    assignedIds,
    stages,
  };
}
