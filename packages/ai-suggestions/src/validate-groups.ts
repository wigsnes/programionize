import type {
  RawSuggestedGroup,
  SuggestedGroup,
  SuggestionInputSession,
  SuggestionRunReport,
} from "./types.js";

export type DuplicateSessionEntry = {
  sessionizeId: string;
  keptInGroupTitle: string;
  duplicateInGroupTitle: string;
};

export function dedupeRawGroups(
  rawGroups: RawSuggestedGroup[],
  inputSessions: SuggestionInputSession[],
): {
  groups: RawSuggestedGroup[];
  duplicates: DuplicateSessionEntry[];
  invalidIds: string[];
} {
  const validIds = new Set(inputSessions.map((s) => s.sessionizeId));
  const seen = new Map<string, string>();
  const duplicates: DuplicateSessionEntry[] = [];
  const invalidIds = new Set<string>();

  const groups = rawGroups.map((group) => {
    const keptIds: string[] = [];
    for (const id of group.sessionizeIds) {
      if (!validIds.has(id)) {
        invalidIds.add(id);
        continue;
      }
      const firstGroup = seen.get(id);
      if (firstGroup) {
        duplicates.push({
          sessionizeId: id,
          keptInGroupTitle: firstGroup,
          duplicateInGroupTitle: group.title,
        });
        continue;
      }
      seen.set(id, group.title);
      keptIds.push(id);
    }
    return { ...group, sessionizeIds: keptIds };
  });

  return {
    groups: groups.filter((group) => group.sessionizeIds.length > 0),
    duplicates,
    invalidIds: [...invalidIds],
  };
}

export function buildSuggestionRunReport(
  groups: SuggestedGroup[],
  inputSessions: SuggestionInputSession[],
  meta: {
    duplicates: DuplicateSessionEntry[];
    invalidIds: string[];
  },
): SuggestionRunReport {
  const groupedIds = new Set(
    groups.flatMap((group) => group.sessions.map((s) => s.sessionizeId)),
  );

  const uncoveredSessions = inputSessions
    .filter((session) => !groupedIds.has(session.sessionizeId))
    .map((session) => ({
      sessionizeId: session.sessionizeId,
      title: session.title,
    }));

  return {
    inputSessionCount: inputSessions.length,
    groupedSessionCount: groupedIds.size,
    uncoveredSessions,
    duplicateSessionIds: meta.duplicates,
    invalidSessionIds: meta.invalidIds,
  };
}
