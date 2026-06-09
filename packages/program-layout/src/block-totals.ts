export type SessionLength = {
  lengthMinutes: number | null;
};

export function computeBlockTotals(sessions: SessionLength[]): {
  sessionCount: number;
  totalMinutes: number;
} {
  return {
    sessionCount: sessions.length,
    totalMinutes: sessions.reduce(
      (sum, session) => sum + (session.lengthMinutes ?? 0),
      0,
    ),
  };
}

export function unassignedSessions<T extends { _id: string }>(
  sessions: T[],
  assignedIds: Set<string>,
): T[] {
  return sessions.filter((session) => !assignedIds.has(session._id));
}
