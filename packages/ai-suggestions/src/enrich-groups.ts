import type {
  RawSuggestedGroup,
  SuggestedGroup,
  SuggestionInputSession,
} from "./types.js";

export function enrichSuggestedGroups(
  rawGroups: RawSuggestedGroup[],
  sessions: SuggestionInputSession[],
): SuggestedGroup[] {
  const byId = new Map(sessions.map((session) => [session.sessionizeId, session]));
  const groups: SuggestedGroup[] = [];

  for (const group of rawGroups) {
    const resolved = group.sessionizeIds
      .map((id) => byId.get(id))
      .filter((session): session is SuggestionInputSession => session !== undefined);

    if (resolved.length === 0) continue;

    groups.push({
      title: group.title,
      rationale: group.rationale,
      sessions: resolved.map((session) => ({
        sessionizeId: session.sessionizeId,
        title: session.title,
        lengthMinutes: session.lengthMinutes,
      })),
      totalMinutes: resolved.reduce(
        (sum, session) => sum + (session.lengthMinutes ?? 0),
        0,
      ),
    });
  }

  return groups;
}

export function formatGroupForClipboard(group: SuggestedGroup): string {
  const lines = [
    group.title,
    group.rationale,
    "",
    ...group.sessions.map(
      (session) =>
        `${session.title} (${session.lengthMinutes ?? "?"} min)`,
    ),
    `Total: ${group.totalMinutes} min`,
  ];
  return lines.join("\n");
}

export { buildSuggestionPrompt, buildSuggestionPrompts } from "./prompt.js";
