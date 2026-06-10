import { buildSessionEmbeddingText } from "./helpers/blockHelpers.js";
import type { Block, Session } from "./types.js";

export type SessionTraceStage =
  | "preprocess"
  | "grouping"
  | "completion"
  | "reconciliation"
  | "critic"
  | "unassigned";

export type SessionTrace = {
  sessionId: string;
  primaryDiscipline: string;
  keywords: string[];
  poolId?: string;
  embeddingText: string;
  stage: SessionTraceStage;
  blockId?: string;
  rationale?: string;
  confidence?: number;
};

/** Collects per-session AI pipeline traces for transparency. */
export class SessionTraceCollector {
  private traces = new Map<string, SessionTrace>();

  private baseTrace(session: Session, poolId?: string): Omit<SessionTrace, "stage"> {
    return {
      sessionId: session.id,
      primaryDiscipline: session.primaryDiscipline ?? session.disciplines[0] ?? "general",
      keywords: session.keywords,
      poolId,
      embeddingText: buildSessionEmbeddingText(session),
    };
  }

  recordPreprocess(session: Session, poolId: string): void {
    this.traces.set(session.id, {
      ...this.baseTrace(session, poolId),
      stage: "preprocess",
    });
  }

  recordGrouping(
    session: Session,
    blockId: string,
    rationale: string,
    poolId: string,
  ): void {
    this.traces.set(session.id, {
      ...this.baseTrace(session, poolId),
      stage: "grouping",
      blockId,
      rationale,
    });
  }

  recordCompletion(
    session: Session,
    blockId: string,
    rationale: string,
    confidence?: number,
  ): void {
    const existing = this.traces.get(session.id);
    this.traces.set(session.id, {
      ...(existing ?? this.baseTrace(session)),
      stage: "completion",
      blockId,
      rationale,
      confidence,
    });
  }

  recordReconciliation(
    session: Session,
    blockId: string,
    rationale: string,
  ): void {
    this.traces.set(session.id, {
      ...this.baseTrace(session),
      stage: "reconciliation",
      blockId,
      rationale,
    });
  }

  recordCritic(session: Session, blockId: string, rationale: string): void {
    const existing = this.traces.get(session.id);
    this.traces.set(session.id, {
      ...(existing ?? this.baseTrace(session)),
      stage: "critic",
      blockId,
      rationale,
    });
  }

  recordUnassigned(sessions: Session[]): void {
    for (const session of sessions) {
      const existing = this.traces.get(session.id);
      this.traces.set(session.id, {
        ...(existing ?? this.baseTrace(session)),
        stage: "unassigned",
      });
    }
  }

  finalizeBlocks(blocks: Block[]): void {
    for (const block of blocks) {
      for (const session of block.sessions) {
        if (!this.traces.has(session.id)) {
          this.recordGrouping(
            session,
            block.id,
            block.rationale,
            session.primaryDiscipline ?? "general",
          );
        }
      }
    }
  }

  getTraces(): SessionTrace[] {
    return [...this.traces.values()].sort((a, b) =>
      a.sessionId.localeCompare(b.sessionId),
    );
  }
}

export function poolIdForDiscipline(discipline: string, chunkIndex: number): string {
  return `${discipline}#${chunkIndex}`;
}
