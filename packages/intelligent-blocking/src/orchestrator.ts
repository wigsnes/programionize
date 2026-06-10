import { runBlockCompletion } from "./blockCompletion.js";
import { runCriticPass } from "./critic.js";
import {
  collectUnassigned,
  runInitialGrouping,
  splitBlocksByCompleteness,
} from "./initialGrouping.js";
import { preprocessSessions } from "./preprocessing.js";
import { runReconciliation } from "./reconciliation.js";
import { SessionTraceCollector } from "./sessionTrace.js";
import type {
  Block,
  BlockingDeps,
  BlockingLogger,
  BlockingMetadata,
  BlockingResult,
  Session,
} from "./types.js";

function defaultLogger(): BlockingLogger {
  return {
    info: () => {},
    warn: () => {},
  };
}

function seedFromExistingBlocks(
  existingBlocks: Block[] | undefined,
  lockedSessionIds: string[] | undefined,
): { blocks: Block[]; assignedIds: Set<string>; lockedIds: Set<string> } {
  const blocks = existingBlocks ? [...existingBlocks] : [];
  const assignedIds = new Set<string>();
  const lockedIds = new Set(lockedSessionIds ?? []);

  for (const block of blocks) {
    for (const session of block.sessions) {
      assignedIds.add(session.id);
      lockedIds.add(session.id);
    }
  }

  return { blocks, assignedIds, lockedIds };
}

/**
 * Main orchestration: preprocess → initial grouping → completion (×2) → reconciliation → critic.
 */
export async function buildIntelligentBlocks(
  allSessions: Session[],
  deps: BlockingDeps,
): Promise<BlockingResult> {
  const logger = deps.logger ?? defaultLogger();
  const traces = deps.traces ?? new SessionTraceCollector();
  const { existingBlocks, lockedSessionIds, scope } = deps.options ?? {};
  const stages: BlockingMetadata["stages"] = [];

  const seeded = seedFromExistingBlocks(existingBlocks, lockedSessionIds);
  const lockedIds = seeded.lockedIds;
  let assignedIds = seeded.assignedIds;
  const preservedBlocks = seeded.blocks;

  const sessionsToProcess = allSessions.filter(
    (session) => !assignedIds.has(session.id),
  );

  if (sessionsToProcess.length === 0 && preservedBlocks.length > 0) {
    return {
      blocks: preservedBlocks,
      unassigned: [],
      metadata: {
        inputSessionCount: allSessions.length,
        assignedSessionCount: assignedIds.size,
        blockCount: preservedBlocks.length,
        unassignedCount: 0,
        stages: [],
        criticFlags: [],
        sessionTraces: traces.getTraces(),
        scope,
      },
    };
  }

  const preprocess = await preprocessSessions(
    sessionsToProcess,
    deps.llm,
    logger,
    traces,
  );
  stages.push(preprocess.stage);

  const sessionById = new Map(
    preprocess.enrichedSessions.map((session) => [session.id, session]),
  );

  const grouping = await runInitialGrouping(
    preprocess.pools,
    sessionById,
    deps.llm,
    logger,
    traces,
  );
  stages.push(grouping.stage);
  assignedIds = new Set([...assignedIds, ...grouping.assignedIds]);

  const allGroupedBlocks = [...preservedBlocks, ...grouping.blocks];
  const { partial, complete } = splitBlocksByCompleteness(allGroupedBlocks);

  const completion = await runBlockCompletion(
    partial,
    complete,
    preprocess.enrichedSessions,
    preprocess.embeddings,
    assignedIds,
    lockedIds,
    deps.llm,
    logger,
  );
  stages.push(...completion.stages);
  assignedIds = completion.assignedIds;

  let workingBlocks = completion.blocks;
  let unassigned = collectUnassigned(preprocess.enrichedSessions, assignedIds);

  if (unassigned.length > 0) {
    const reconciliation = await runReconciliation(
      unassigned,
      assignedIds,
      sessionById,
      deps.llm,
      traces,
      logger,
    );
    stages.push(...reconciliation.stages);
    assignedIds = reconciliation.assignedIds;
    workingBlocks = [...workingBlocks, ...reconciliation.blocks];
    unassigned = collectUnassigned(preprocess.enrichedSessions, assignedIds);
  }

  const critic = await runCriticPass(
    workingBlocks,
    preprocess.enrichedSessions,
    preprocess.embeddings,
    assignedIds,
    lockedIds,
    deps.llm,
    logger,
  );
  if (critic.stage) stages.push(critic.stage);
  assignedIds = critic.assignedIds;
  workingBlocks = critic.blocks;

  unassigned = collectUnassigned(preprocess.enrichedSessions, assignedIds);
  traces.recordUnassigned(unassigned);
  traces.finalizeBlocks(workingBlocks);

  logger.info("buildIntelligentBlocks complete", {
    blockCount: workingBlocks.length,
    unassignedCount: unassigned.length,
    stages: stages.map((stage) => stage.name),
  });

  return {
    blocks: workingBlocks,
    unassigned,
    metadata: {
      inputSessionCount: allSessions.length,
      assignedSessionCount: assignedIds.size,
      blockCount: workingBlocks.length,
      unassignedCount: unassigned.length,
      stages,
      criticFlags: critic.criticFlags,
      sessionTraces: traces.getTraces(),
      scope,
    },
  };
}
