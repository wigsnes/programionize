import type { SuggestionInputSession } from "@programionize/ai-suggestions";
import type { Block, Session } from "@programionize/intelligent-blocking";
import {
  blockFromSessions,
  buildSessionEmbeddingText,
  fromSuggestionInput,
  mapSuggestionInputs,
} from "@programionize/intelligent-blocking";
import {
  effectiveShowInCatalog,
  parseSchedulableStatuses,
} from "@programionize/session-import";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type DbSessionRow = {
  _id: Id<"sessions">;
  sessionizeId: string;
  title: string;
  description: string | null;
  lengthMinutes: number | null;
  field: string | null;
  speakerNames: string[];
  sessionizeStatus?: string;
  status: "active" | "removed";
  isServiceSession: boolean;
  showInCatalog?: boolean;
};

export function toSuggestionInput(session: DbSessionRow): SuggestionInputSession {
  return {
    sessionizeId: session.sessionizeId,
    title: session.title,
    description: session.description,
    lengthMinutes: session.lengthMinutes,
    field: session.field,
    speakerNames: session.speakerNames,
  };
}

export function toBlockingSession(
  session: DbSessionRow,
  profile?: {
    primaryDiscipline: string;
    keywords: string[];
  },
): Session | null {
  const mapped = fromSuggestionInput(toSuggestionInput(session));
  if (!mapped.ok) return null;
  if (profile) {
    mapped.session.primaryDiscipline = profile.primaryDiscipline;
    mapped.session.keywords = profile.keywords;
    if (mapped.session.disciplines.length === 0) {
      mapped.session.disciplines = [profile.primaryDiscipline];
    }
  }
  return mapped.session;
}

export async function loadSchedulableSessions(ctx: QueryCtx): Promise<{
  rows: DbSessionRow[];
  inputs: SuggestionInputSession[];
  blocking: Session[];
  skippedIds: string[];
}> {
  const allowedStatuses = parseSchedulableStatuses(
    process.env.SESSIONIZE_SCHEDULABLE_STATUSES,
  );

  const all = await ctx.db.query("sessions").collect();
  const rows = all.filter(
    (session) =>
      !session.isServiceSession &&
      effectiveShowInCatalog(
        {
          status: session.status,
          isServiceSession: session.isServiceSession,
          sessionizeStatus: session.sessionizeStatus,
          showInCatalog: session.showInCatalog,
        },
        allowedStatuses,
      ),
  ) as DbSessionRow[];

  const inputs = rows.map(toSuggestionInput);
  const { skipped } = mapSuggestionInputs(inputs);

  const profiles = await Promise.all(
    rows.map(async (row) => {
      const profile = await ctx.db
        .query("sessionAiProfiles")
        .withIndex("by_session", (q) => q.eq("sessionId", row._id))
        .first();
      return { row, profile };
    }),
  );

  const profileBySessionizeId = new Map(
    profiles
      .filter((entry) => entry.profile)
      .map((entry) => [
        entry.row.sessionizeId,
        {
          primaryDiscipline: entry.profile!.primaryDiscipline,
          keywords: entry.profile!.keywords,
        },
      ]),
  );

  const blocking = rows
    .map((row) =>
      toBlockingSession(row, profileBySessionizeId.get(row.sessionizeId)),
    )
    .filter((session): session is Session => session !== null);

  const skippedIds = skipped
    .map((entry) => (entry.ok ? "" : entry.sessionizeId))
    .filter(Boolean);

  return { rows, inputs: inputs.filter((input) => blocking.some((s) => s.id === input.sessionizeId)), blocking, skippedIds };
}

export async function loadPageBlocks(
  ctx: QueryCtx,
  programPageId: Id<"programPages">,
): Promise<Block[]> {
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_page", (q) => q.eq("programPageId", programPageId))
    .collect();

  const result: Block[] = [];
  for (const block of blocks.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const placements = await ctx.db
      .query("blockSessions")
      .withIndex("by_block", (q) => q.eq("blockId", block._id))
      .collect();
    const sessions: Session[] = [];
    for (const placement of placements.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const session = await ctx.db.get(placement.sessionId);
      if (!session) continue;
      const mapped = toBlockingSession(session as DbSessionRow);
      if (mapped) sessions.push(mapped);
    }
    if (sessions.length === 0) continue;
    const discipline =
      sessions[0]?.primaryDiscipline ??
      sessions[0]?.disciplines[0] ??
      "general";
    result.push(
      blockFromSessions(
        sessions,
        discipline,
        block.label ?? `Block on page`,
        `block_${block._id}`,
      ),
    );
  }
  return result;
}

export function modelIdFromEnv(): string {
  return process.env.LLM_PROVIDER === "anthropic"
    ? (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514")
    : (process.env.OPENAI_MODEL ?? "gpt-4o-mini");
}

export { buildSessionEmbeddingText };
