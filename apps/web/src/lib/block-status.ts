import {
  evaluateBlock,
  type BlockSessionInput,
  type BlockWarning,
  type BlockWarningCode,
} from "@programionize/block-rules";

export type BlockStatus = "good" | "warning" | "building" | "empty";

const MIN_MINUTES = 80;
const MAX_MINUTES = 90;

const HARD_WARNING_CODES = new Set<BlockWarningCode>([
  "too_many_sessions",
  "duration_too_long",
  "removed_session",
  "unknown_length",
]);

export function getHardWarnings(warnings: BlockWarning[]): BlockWarning[] {
  return warnings.filter((warning) => HARD_WARNING_CODES.has(warning.code));
}

export function getBlockStatus(
  sessions: BlockSessionInput[],
  totalMinutes: number,
): BlockStatus {
  if (sessions.length === 0) return "empty";

  const { warnings } = evaluateBlock(sessions);
  if (getHardWarnings(warnings).length > 0) return "warning";

  if (totalMinutes < MIN_MINUTES) return "building";

  if (totalMinutes >= MIN_MINUTES && totalMinutes <= MAX_MINUTES) {
    return "good";
  }

  return "warning";
}

export function getBlockWarnings(
  sessions: BlockSessionInput[],
): BlockWarning[] {
  return evaluateBlock(sessions).warnings;
}
