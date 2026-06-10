import type { SuggestedGroup } from "./types.js";

export type WorkspaceBlockSession = {
  sessionizeId: string;
  title: string;
};

export type WorkspaceBlock = {
  _id: string;
  label: string | null;
  sessions: WorkspaceBlockSession[];
};

export type ApplyPreviewSession = {
  sessionizeId: string;
  title: string;
  fromBlockLabel: string | null;
};

export type ApplyPreviewSkipped = {
  sessionizeId: string;
  title: string;
  reason: string;
};

export type ApplyPreview = {
  blockTitle: string;
  toAssign: ApplyPreviewSession[];
  skipped: ApplyPreviewSkipped[];
  moveCount: number;
};

export function buildApplyPreview(
  group: SuggestedGroup,
  blocks: WorkspaceBlock[],
): ApplyPreview {
  const placementBySessionizeId = new Map<
    string,
    { blockLabel: string | null }
  >();

  for (const block of blocks) {
    for (const session of block.sessions) {
      placementBySessionizeId.set(session.sessionizeId, {
        blockLabel: block.label,
      });
    }
  }

  const toAssign: ApplyPreviewSession[] = [];
  const skipped: ApplyPreviewSkipped[] = [];
  let moveCount = 0;

  for (const session of group.sessions) {
    const existing = placementBySessionizeId.get(session.sessionizeId);
    if (existing) {
      toAssign.push({
        sessionizeId: session.sessionizeId,
        title: session.title,
        fromBlockLabel: existing.blockLabel,
      });
      moveCount += 1;
    } else {
      toAssign.push({
        sessionizeId: session.sessionizeId,
        title: session.title,
        fromBlockLabel: null,
      });
    }
  }

  return {
    blockTitle: group.title,
    toAssign,
    skipped,
    moveCount,
  };
}

export function buildBulkApplyPreview(
  groups: SuggestedGroup[],
  blocks: WorkspaceBlock[],
): {
  groups: ApplyPreview[];
  totalNewBlocks: number;
  totalMoves: number;
  totalSessions: number;
} {
  const previews = groups.map((group) => buildApplyPreview(group, blocks));
  return {
    groups: previews,
    totalNewBlocks: previews.length,
    totalMoves: previews.reduce((sum, preview) => sum + preview.moveCount, 0),
    totalSessions: previews.reduce(
      (sum, preview) => sum + preview.toAssign.length,
      0,
    ),
  };
}

export function formatApplyPreviewSummary(preview: ApplyPreview): string {
  const lines = [
    `Create block "${preview.blockTitle}"`,
    "",
    ...preview.toAssign.map((session) => {
      if (session.fromBlockLabel) {
        return `• ${session.title} (move from ${session.fromBlockLabel})`;
      }
      return `• ${session.title}`;
    }),
  ];
  if (preview.skipped.length > 0) {
    lines.push("", "Skipped:");
    for (const session of preview.skipped) {
      lines.push(`• ${session.title}: ${session.reason}`);
    }
  }
  return lines.join("\n");
}
