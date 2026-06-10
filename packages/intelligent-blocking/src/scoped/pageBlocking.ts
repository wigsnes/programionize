import type { BlockingDeps, BlockingResult, Block, Session } from "../types.js";
import { buildIntelligentBlocks } from "../orchestrator.js";

export type { BlockingScope } from "../types.js";

export type PageBlockingRequest = {
  scope: "page_unassigned" | "page_regroup";
  /** All catalog sessions available for grouping. */
  catalogSessions: Session[];
  /** Sessions already placed on the page (locked). */
  existingBlocks: Block[];
  lockedSessionIds: string[];
};

/**
 * Groups unassigned catalog sessions while respecting locked blocks on a page.
 */
export async function buildBlocksForPage(
  request: PageBlockingRequest,
  deps: BlockingDeps,
): Promise<BlockingResult> {
  const lockedSet = new Set(request.lockedSessionIds);
  const placedIds = new Set(
    request.existingBlocks.flatMap((block) => block.sessions.map((s) => s.id)),
  );

  const sessionsToGroup =
    request.scope === "page_unassigned"
      ? request.catalogSessions.filter(
          (session) => !placedIds.has(session.id) && !lockedSet.has(session.id),
        )
      : request.catalogSessions.filter((session) => !lockedSet.has(session.id));

  const existingBlocks =
    request.scope === "page_regroup" ? request.existingBlocks : request.existingBlocks;

  const result = await buildIntelligentBlocks(sessionsToGroup, {
    ...deps,
    options: {
      existingBlocks:
        request.scope === "page_regroup" ? existingBlocks : request.existingBlocks,
      lockedSessionIds: request.lockedSessionIds,
    },
  });

  return {
    ...result,
    metadata: {
      ...result.metadata,
      scope: request.scope,
    },
  };
}

export function sessionsToBlocks(
  blocks: Block[],
  lockedSessionIds: string[],
): { existingBlocks: Block[]; lockedSessionIds: string[] } {
  return { existingBlocks: blocks, lockedSessionIds };
}
