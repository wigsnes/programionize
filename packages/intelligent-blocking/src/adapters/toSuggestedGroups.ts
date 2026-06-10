import type {
  SuggestedGroup,
  SuggestionInputSession,
  SuggestionRunReport,
  UncoveredSession,
} from "@programionize/ai-suggestions";
import type { Block, BlockingResult } from "../types.js";

function blockTitle(block: Block): string {
  const discipline =
    block.primaryDiscipline.charAt(0).toUpperCase() +
    block.primaryDiscipline.slice(1);
  return `${discipline} block (${block.sessions.length} sessions)`;
}

/**
 * Maps blocking output into SuggestedGroup[] for the existing suggestions UI.
 */
export function toSuggestedGroups(
  result: BlockingResult,
  sourceSessions: SuggestionInputSession[],
): SuggestedGroup[] {
  const byId = new Map(
    sourceSessions.map((session) => [session.sessionizeId, session]),
  );

  return result.blocks.map((block) => {
    const sessions = block.sessions
      .map((session) => byId.get(session.id))
      .filter((session): session is SuggestionInputSession => session !== undefined);

    return {
      title: blockTitle(block),
      rationale: block.rationale,
      sessions: sessions.map((session) => ({
        sessionizeId: session.sessionizeId,
        title: session.title,
        lengthMinutes: session.lengthMinutes,
        field: session.field,
      })),
      totalMinutes: block.totalDuration,
      warnings: [],
    };
  });
}

export function toUncoveredSessions(
  result: BlockingResult,
): UncoveredSession[] {
  return result.unassigned.map((session) => ({
    sessionizeId: session.id,
    title: session.title,
  }));
}

export function buildBlockingRunReport(
  result: BlockingResult,
  inputSessionCount: number,
  skippedSessionIds: string[] = [],
): SuggestionRunReport {
  const groupedSessionCount = result.blocks.reduce(
    (sum, block) => sum + block.sessions.length,
    0,
  );

  return {
    inputSessionCount,
    groupedSessionCount,
    uncoveredSessions: toUncoveredSessions(result),
    duplicateSessionIds: [],
    invalidSessionIds: skippedSessionIds,
  };
}
