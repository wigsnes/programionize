import type { Block, Session } from "../types.js";

const MAX_SESSIONS = 3;
const MAX_MINUTES = 90;

export function createBlockId(): string {
  return `block_${crypto.randomUUID()}`;
}

export function calculateTotalDuration(sessions: Session[]): number {
  return sessions.reduce((sum, session) => sum + session.duration, 0);
}

export type BlockValidationResult = {
  valid: boolean;
  errors: string[];
};

/** Validates max 3 sessions and total duration ≤ 90 minutes. */
export function validateBlock(block: Pick<Block, "sessions">): BlockValidationResult {
  const errors: string[] = [];

  if (block.sessions.length > MAX_SESSIONS) {
    errors.push(`Block has ${block.sessions.length} sessions (max ${MAX_SESSIONS})`);
  }

  const total = calculateTotalDuration(block.sessions);
  if (total > MAX_MINUTES) {
    errors.push(`Block duration is ${total} min (max ${MAX_MINUTES})`);
  }

  return { valid: errors.length === 0, errors };
}

export function isPartialBlock(block: Block): boolean {
  return block.sessions.length >= 1 && block.sessions.length <= 2;
}

export function isCompleteBlock(block: Block): boolean {
  return block.sessions.length === 3 || calculateTotalDuration(block.sessions) >= 80;
}

export function buildBlockFromSessions(
  sessions: Session[],
  primaryDiscipline: string,
  rationale: string,
  confidence?: number,
): Block {
  return {
    id: createBlockId(),
    sessions,
    totalDuration: calculateTotalDuration(sessions),
    primaryDiscipline,
    rationale,
    confidence,
  };
}

export function buildSessionEmbeddingText(session: Session): string {
  const disciplineText =
    session.disciplines.length > 0 ? session.disciplines.join(", ") : "";
  const keywordText = session.keywords.length > 0 ? session.keywords.join(", ") : "";
  return [session.title, session.description, disciplineText, keywordText]
    .filter(Boolean)
    .join("\n");
}

export function buildBlockEmbeddingText(block: Block): string {
  return block.sessions.map(buildSessionEmbeddingText).join("\n\n");
}
