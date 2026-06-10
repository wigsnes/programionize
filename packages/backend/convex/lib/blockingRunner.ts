"use node";

import {
  attachBlockWarnings,
  toSuggestionGenerateError,
  type SuggestionInputSession,
} from "@programionize/ai-suggestions";
import {
  buildBlockingRunReport,
  buildBlocksForPage,
  buildIntelligentBlocks,
  completePartialBlock,
  createBlockingClientFromEnv,
  reviewSingleBlock,
  SessionTraceCollector,
  toSuggestedGroups,
  type Block,
  type BlockingResult,
  type BlockingScope,
  type Session,
} from "@programionize/intelligent-blocking";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { modelIdFromEnv } from "./aiShared";

export type SchedulableData = {
  blocking: Session[];
  inputs: SuggestionInputSession[];
  skippedIds: string[];
};

export type StoredRunResult = {
  groups: ReturnType<typeof attachBlockWarnings>;
  report: ReturnType<typeof buildBlockingRunReport>;
  createdAt: number;
  metadata: BlockingResult["metadata"];
};

export async function storeBlockingResult(
  ctx: ActionCtx,
  args: {
    result: BlockingResult;
    schedulableInputs: SuggestionInputSession[];
    scope: BlockingScope;
    programPageId?: Id<"programPages">;
    skippedIds: string[];
    modelId: string;
  },
): Promise<StoredRunResult> {
  const enriched = attachBlockWarnings(
    toSuggestedGroups(args.result, args.schedulableInputs),
  );
  const report = buildBlockingRunReport(
    args.result,
    args.schedulableInputs.length,
    args.skippedIds,
  );
  const createdAt = Date.now();

  const { internal } = await import("../_generated/api");
  await ctx.runMutation(internal.suggestionsInternals.storeRun, {
    groups: enriched,
    report,
    model: args.modelId,
    createdAt,
    scope: args.scope,
    programPageId: args.programPageId,
    metadata: args.result.metadata,
  });

  return { groups: enriched, report, createdAt, metadata: args.result.metadata };
}

export function createBlockingClient() {
  return createBlockingClientFromEnv(process.env);
}

export function createBlockingLogger() {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      console.log(message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      console.warn(message, data),
  };
}

export async function ensureSessionProfiles(
  ctx: ActionCtx,
  sessionToken: string,
) {
  try {
    const { internal } = await import("../_generated/api");
    await ctx.runAction(internal.aiEnrich.enrichProfilesInternal, {
      sessionToken,
      force: false,
    });
  } catch {
    // optional cache
  }
}

export async function runGenerateFull(
  ctx: ActionCtx,
  sessionToken: string,
  data: SchedulableData,
): Promise<StoredRunResult> {
  if (data.blocking.length === 0) {
    throw new Error(
      "No sessions with supported durations (15/30/45/60 min) for blocking.",
    );
  }

  await ensureSessionProfiles(ctx, sessionToken);

  const result = await buildIntelligentBlocks(data.blocking, {
    llm: createBlockingClient(),
    logger: createBlockingLogger(),
    traces: new SessionTraceCollector(),
    options: { scope: "full" },
  });

  return await storeBlockingResult(ctx, {
    result,
    schedulableInputs: data.inputs,
    scope: "full",
    skippedIds: data.skippedIds,
    modelId: modelIdFromEnv(),
  });
}

export async function runGenerateForPage(
  ctx: ActionCtx,
  sessionToken: string,
  programPageId: Id<"programPages">,
  mode: "unassigned" | "regroup",
  data: SchedulableData,
  existingBlocks: Block[],
): Promise<StoredRunResult> {
  const lockedSessionIds = existingBlocks.flatMap((block) =>
    block.sessions.map((session) => session.id),
  );

  const scope: BlockingScope =
    mode === "unassigned" ? "page_unassigned" : "page_regroup";

  await ensureSessionProfiles(ctx, sessionToken);

  const result = await buildBlocksForPage(
    {
      scope,
      catalogSessions: data.blocking,
      existingBlocks,
      lockedSessionIds,
    },
    {
      llm: createBlockingClient(),
      logger: createBlockingLogger(),
      traces: new SessionTraceCollector(),
      options: { scope, lockedSessionIds, existingBlocks },
    },
  );

  return await storeBlockingResult(ctx, {
    result,
    schedulableInputs: data.inputs,
    scope,
    programPageId,
    skippedIds: data.skippedIds,
    modelId: modelIdFromEnv(),
  });
}

export async function runCompleteBlock(
  ctx: ActionCtx,
  data: SchedulableData,
  programPageId: Id<"programPages">,
  target: Block,
  pageBlocks: Block[],
): Promise<StoredRunResult> {
  const assignedIds = new Set<string>(
    pageBlocks.flatMap((block) => block.sessions.map((session) => session.id)),
  );

  const result = await completePartialBlock(
    { block: target, candidatePool: data.blocking, assignedIds },
    {
      llm: createBlockingClient(),
      logger: createBlockingLogger(),
      traces: new SessionTraceCollector(),
    },
  );

  return await storeBlockingResult(ctx, {
    result,
    schedulableInputs: data.inputs,
    scope: "block_complete",
    programPageId,
    skippedIds: data.skippedIds,
    modelId: modelIdFromEnv(),
  });
}

export async function runReviewBlock(
  ctx: ActionCtx,
  data: SchedulableData,
  programPageId: Id<"programPages">,
  target: Block,
  pageBlocks: Block[],
): Promise<StoredRunResult> {
  const assignedIds = new Set<string>(
    pageBlocks.flatMap((block) => block.sessions.map((session) => session.id)),
  );

  const result = await reviewSingleBlock(
    { block: target, candidatePool: data.blocking, assignedIds },
    {
      llm: createBlockingClient(),
      logger: createBlockingLogger(),
      traces: new SessionTraceCollector(),
    },
  );

  return await storeBlockingResult(ctx, {
    result,
    schedulableInputs: data.inputs,
    scope: "block_review",
    programPageId,
    skippedIds: data.skippedIds,
    modelId: modelIdFromEnv(),
  });
}

export { toSuggestionGenerateError };
