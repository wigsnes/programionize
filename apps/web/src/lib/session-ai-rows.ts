import type { SessionAiRow } from "../components/SessionAiDrawer";

type Trace = {
  sessionId: string;
  primaryDiscipline: string;
  keywords: string[];
  poolId?: string;
  embeddingText: string;
  stage: string;
  blockId?: string;
  rationale?: string;
  confidence?: number;
};

type Profile = {
  sessionizeId: string;
  title: string;
  field: string | null;
  lengthMinutes: number | null;
  profile: {
    primaryDiscipline: string;
    keywords: string[];
    embeddingText: string;
  } | null;
};

type Group = {
  title: string;
  sessions: { sessionizeId: string }[];
};

export function buildSessionAiRows(
  profiles: Profile[],
  traces: Trace[] | undefined,
  groups: Group[],
): SessionAiRow[] {
  const blockTitleBySessionId = new Map<string, string>();
  for (const group of groups) {
    for (const session of group.sessions) {
      blockTitleBySessionId.set(session.sessionizeId, group.title);
    }
  }

  const traceBySessionId = new Map(
    (traces ?? []).map((trace) => [trace.sessionId, trace]),
  );

  return profiles.map((entry) => {
    const trace = traceBySessionId.get(entry.sessionizeId);
    return {
      sessionizeId: entry.sessionizeId,
      title: entry.title,
      field: entry.field,
      lengthMinutes: entry.lengthMinutes,
      aiDiscipline:
        trace?.primaryDiscipline ??
        entry.profile?.primaryDiscipline ??
        entry.field?.toLowerCase() ??
        "general",
      keywords: trace?.keywords ?? entry.profile?.keywords ?? [],
      embeddingText: trace?.embeddingText ?? entry.profile?.embeddingText,
      poolId: trace?.poolId,
      stage: trace?.stage ?? "unknown",
      blockTitle: blockTitleBySessionId.get(entry.sessionizeId),
      rationale: trace?.rationale,
      confidence: trace?.confidence,
    };
  });
}

export function groupTitleBySessionId(groups: Group[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    for (const session of group.sessions) {
      map.set(session.sessionizeId, group.title);
    }
  }
  return map;
}
