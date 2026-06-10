import { runBlockCompletion } from "../blockCompletion.js";
import { runCriticPass } from "../critic.js";
import {
  buildBlockFromSessions,
  validateBlock,
} from "../helpers/blockHelpers.js";
import type { BlockingDeps, BlockingResult, Block, Session, SessionEmbeddings } from "../types.js";
import { SessionTraceCollector } from "../sessionTrace.js";
import { preprocessSessions } from "../preprocessing.js";

export type CompleteBlockRequest = {
  block: Block;
  candidatePool: Session[];
  assignedIds: Set<string>;
  lockedIds?: Set<string>;
};

/**
 * Completes a single partial block by running the completion pass only.
 */
export async function completePartialBlock(
  request: CompleteBlockRequest,
  deps: BlockingDeps,
  embeddings?: SessionEmbeddings,
): Promise<BlockingResult> {
  const traces = deps.traces ?? new SessionTraceCollector();
  const lockedIds = request.lockedIds ?? new Set<string>();

  let sessionEmbeddings = embeddings;
  if (!sessionEmbeddings) {
    const allSessions = [
      ...request.block.sessions,
      ...request.candidatePool.filter((s) => !request.assignedIds.has(s.id)),
    ];
    const unique = [...new Map(allSessions.map((s) => [s.id, s])).values()];
    const pre = await preprocessSessions(unique, deps.llm, deps.logger);
    sessionEmbeddings = pre.embeddings;
  }

  const completion = await runBlockCompletion(
    [request.block],
    [],
    request.candidatePool,
    sessionEmbeddings,
    new Set(request.assignedIds),
    lockedIds,
    deps.llm,
    deps.logger,
  );

  const resultBlock = completion.blocks[0] ?? request.block;
  for (const session of resultBlock.sessions) {
    if (!request.block.sessions.some((s) => s.id === session.id)) {
      traces.recordCompletion(session, resultBlock.id, resultBlock.rationale, resultBlock.confidence);
    }
  }

  return {
    blocks: [resultBlock],
    unassigned: request.candidatePool.filter((s) => !completion.assignedIds.has(s.id)),
    metadata: {
      inputSessionCount: request.candidatePool.length + request.block.sessions.length,
      assignedSessionCount: completion.assignedIds.size,
      blockCount: 1,
      unassignedCount: 0,
      stages: completion.stages,
      criticFlags: [],
      sessionTraces: traces.getTraces(),
      scope: "block_complete",
    },
  };
}

export type ReviewBlockRequest = {
  block: Block;
  candidatePool: Session[];
  assignedIds: Set<string>;
  lockedIds?: Set<string>;
};

/**
 * Reviews a single block for coherence using the critic pass.
 */
export async function reviewSingleBlock(
  request: ReviewBlockRequest,
  deps: BlockingDeps,
  embeddings?: SessionEmbeddings,
): Promise<BlockingResult> {
  const traces = deps.traces ?? new SessionTraceCollector();
  const lockedIds = request.lockedIds ?? new Set<string>();

  let sessionEmbeddings = embeddings;
  if (!sessionEmbeddings) {
    const pre = await preprocessSessions(
      [...request.block.sessions, ...request.candidatePool.slice(0, 30)],
      deps.llm,
      deps.logger,
    );
    sessionEmbeddings = pre.embeddings;
  }

  const critic = await runCriticPass(
    [request.block],
    request.candidatePool,
    sessionEmbeddings,
    new Set(request.assignedIds),
    lockedIds,
    deps.llm,
    deps.logger,
  );

  const resultBlock = critic.blocks[0] ?? request.block;
  for (const session of resultBlock.sessions) {
    traces.recordCritic(session, resultBlock.id, resultBlock.rationale);
  }

  return {
    blocks: [resultBlock],
    unassigned: [],
    metadata: {
      inputSessionCount: request.block.sessions.length,
      assignedSessionCount: request.block.sessions.length,
      blockCount: 1,
      unassignedCount: 0,
      stages: critic.stage ? [critic.stage] : [],
      criticFlags: critic.criticFlags,
      sessionTraces: traces.getTraces(),
      scope: "block_review",
    },
  };
}

export function blockFromSessions(
  sessions: Session[],
  primaryDiscipline: string,
  rationale: string,
  blockId?: string,
): Block {
  const block = buildBlockFromSessions(sessions, primaryDiscipline, rationale);
  if (blockId) block.id = blockId;
  return block;
}

export function isBlockCompletable(block: Block): boolean {
  return block.sessions.length >= 1 && block.sessions.length < 3 && validateBlock(block).valid;
}
