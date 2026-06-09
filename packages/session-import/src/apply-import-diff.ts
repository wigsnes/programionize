import type {
  ExistingSession,
  ImportDiffResult,
  ImportedSession,
} from "./types.js";

export function applyImportDiff(
  existing: ExistingSession[],
  incoming: ImportedSession[],
): ImportDiffResult {
  const incomingIds = new Set(incoming.map((session) => session.sessionizeId));
  const markRemovedIds = existing
    .filter(
      (session) =>
        !incomingIds.has(session.sessionizeId) && session.status !== "removed",
    )
    .map((session) => session.sessionizeId);

  return {
    upserts: incoming,
    markRemovedIds,
  };
}
