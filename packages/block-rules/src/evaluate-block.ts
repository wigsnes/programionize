export type BlockSessionInput = {
  lengthMinutes: number | null;
  status?: "active" | "removed";
  hiddenFromCatalog?: boolean;
};

export type BlockWarningCode =
  | "too_many_sessions"
  | "duration_too_short"
  | "duration_too_long"
  | "unknown_length"
  | "removed_session";

export type BlockWarning = {
  code: BlockWarningCode;
  message: string;
};

const MAX_SESSIONS = 3;
const MIN_MINUTES = 80;
const MAX_MINUTES = 90;

function totalMinutes(sessions: BlockSessionInput[]): number {
  return sessions.reduce(
    (sum, session) => sum + (session.lengthMinutes ?? 0),
    0,
  );
}

export function evaluateBlock(
  sessions: BlockSessionInput[],
): { warnings: BlockWarning[] } {
  const warnings: BlockWarning[] = [];

  if (sessions.length > MAX_SESSIONS) {
    warnings.push({
      code: "too_many_sessions",
      message: `More than ${MAX_SESSIONS} sessions in this block (${sessions.length})`,
    });
  }

  const minutes = totalMinutes(sessions);
  if (sessions.length > 0 && minutes < MIN_MINUTES) {
    warnings.push({
      code: "duration_too_short",
      message: `Block is under ${MIN_MINUTES} minutes (${minutes} min)`,
    });
  }
  if (minutes > MAX_MINUTES) {
    warnings.push({
      code: "duration_too_long",
      message: `Block is over ${MAX_MINUTES} minutes (${minutes} min)`,
    });
  }

  if (sessions.some((session) => session.lengthMinutes === null)) {
    warnings.push({
      code: "unknown_length",
      message: "One or more sessions have unknown length",
    });
  }

  if (
    sessions.some(
      (session) =>
        session.status === "removed" || session.hiddenFromCatalog === true,
    )
  ) {
    warnings.push({
      code: "removed_session",
      message: "This block contains a session no longer in the catalog",
    });
  }

  return { warnings };
}
