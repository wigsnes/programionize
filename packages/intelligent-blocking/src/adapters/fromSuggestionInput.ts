import type { SuggestionInputSession } from "@programionize/ai-suggestions";
import type { Session, SessionDuration } from "../types.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "in",
  "on",
  "with",
  "how",
  "what",
  "why",
  "your",
  "our",
  "from",
  "into",
]);

const VALID_DURATIONS = new Set<SessionDuration>([15, 30, 45, 60]);

function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 5);
}

function toDuration(minutes: number | null): SessionDuration | null {
  if (minutes === null) return null;
  if (VALID_DURATIONS.has(minutes as SessionDuration)) {
    return minutes as SessionDuration;
  }
  return null;
}

export type FromSuggestionInputResult =
  | { ok: true; session: Session }
  | { ok: false; sessionizeId: string; reason: string };

/**
 * Maps catalog sessions into blocking Session objects.
 */
export function fromSuggestionInput(
  input: SuggestionInputSession,
): FromSuggestionInputResult {
  const duration = toDuration(input.lengthMinutes);
  if (duration === null) {
    return {
      ok: false,
      sessionizeId: input.sessionizeId,
      reason: `Unsupported or missing duration: ${input.lengthMinutes ?? "null"}`,
    };
  }

  const disciplines = input.field
    ? [input.field.toLowerCase()]
    : [];

  return {
    ok: true,
    session: {
      id: input.sessionizeId,
      title: input.title,
      description: input.description ?? "",
      duration,
      disciplines,
      keywords: extractKeywords(input.title),
      primaryDiscipline: disciplines[0],
    },
  };
}

export function mapSuggestionInputs(
  inputs: SuggestionInputSession[],
): { sessions: Session[]; skipped: FromSuggestionInputResult[] } {
  const sessions: Session[] = [];
  const skipped: FromSuggestionInputResult[] = [];

  for (const input of inputs) {
    const mapped = fromSuggestionInput(input);
    if (mapped.ok) {
      sessions.push(mapped.session);
    } else {
      skipped.push(mapped);
    }
  }

  return { sessions, skipped };
}
