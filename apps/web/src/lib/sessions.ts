import {
  DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
  effectiveShowInCatalog,
  isHiddenFromCatalog,
  isSessionizeSchedulable,
} from "@programionize/session-import";

export type SessionStatus = "active" | "removed";

export type CatalogSession = {
  _id: string;
  title: string;
  description: string | null;
  field: string | null;
  lengthMinutes: number | null;
  speakerNames: string[];
  isServiceSession: boolean;
  sessionizeStatus: string | null;
  status: SessionStatus;
  showInCatalog?: boolean;
};

export { effectiveShowInCatalog, isHiddenFromCatalog };

export function isSchedulableSession(session: CatalogSession): boolean {
  return (
    !session.isServiceSession &&
    isSessionizeSchedulable(
      session.sessionizeStatus ?? "",
      DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
    )
  );
}

export function partitionCatalogSessions(sessions: CatalogSession[]): {
  schedulable: CatalogSession[];
  service: CatalogSession[];
  /** Imported from Sessionize but outside Accept queue / Accepted. */
  otherImported: CatalogSession[];
} {
  const schedulable: CatalogSession[] = [];
  const service: CatalogSession[] = [];
  const otherImported: CatalogSession[] = [];
  for (const session of sessions) {
    if (session.status !== "active") continue;
    if (!effectiveShowInCatalog(session)) {
      otherImported.push(session);
      continue;
    }
    if (session.isServiceSession) {
      service.push(session);
    } else {
      schedulable.push(session);
    }
  }
  return { schedulable, service, otherImported };
}

export function sortSessions(sessions: CatalogSession[]): CatalogSession[] {
  return [...sessions].sort((a, b) => {
    const lengthA = a.lengthMinutes ?? Number.MAX_SAFE_INTEGER;
    const lengthB = b.lengthMinutes ?? Number.MAX_SAFE_INTEGER;
    if (lengthA !== lengthB) return lengthA - lengthB;
    return a.title.localeCompare(b.title);
  });
}

export function filterSessions(
  sessions: CatalogSession[],
  query: string,
): CatalogSession[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sessions;

  return sessions.filter((session) => {
    const haystack = [
      session.title,
      session.description ?? "",
      ...session.speakerNames,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function uniqueFields(sessions: CatalogSession[]): string[] {
  const fields = new Set<string>();
  for (const session of sessions) {
    if (session.field) fields.add(session.field);
  }
  return [...fields].sort((a, b) => a.localeCompare(b));
}

export function filterByField(
  sessions: CatalogSession[],
  field: string | null,
): CatalogSession[] {
  if (!field) return sessions;
  return sessions.filter((session) => session.field === field);
}

export function uniqueLengths(sessions: CatalogSession[]): number[] {
  const lengths = new Set<number>();
  for (const session of sessions) {
    if (session.lengthMinutes != null) lengths.add(session.lengthMinutes);
  }
  return [...lengths].sort((a, b) => a - b);
}

export function filterByLength(
  sessions: CatalogSession[],
  lengthMinutes: number | null,
): CatalogSession[] {
  if (lengthMinutes === null) return sessions;
  return sessions.filter((session) => session.lengthMinutes === lengthMinutes);
}

export type SelectedBlockStats = {
  sessionCount: number;
  totalMinutes: number;
};

export function filterFitsBlock(
  sessions: CatalogSession[],
  block: SelectedBlockStats | null,
): CatalogSession[] {
  if (!block) return sessions;
  return sessions.filter((session) => {
    const length = session.lengthMinutes ?? 0;
    return (
      block.sessionCount < 3 &&
      block.totalMinutes + length <= 90
    );
  });
}
