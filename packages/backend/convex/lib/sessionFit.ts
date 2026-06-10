import { blockFromSessions, scoreSessionFit } from "@programionize/intelligent-blocking";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { toBlockingSession } from "./aiShared";

export async function computeSessionFitForBlock(
  ctx: QueryCtx,
  sessionId: Id<"sessions">,
  blockId: Id<"blocks">,
) {
  const session = await ctx.db.get(sessionId);
  if (!session) return null;

  const block = await ctx.db.get(blockId);
  if (!block) return null;

  const mappedSession = toBlockingSession(session);
  if (!mappedSession) return null;

  const placements = await ctx.db
    .query("blockSessions")
    .withIndex("by_block", (q) => q.eq("blockId", blockId))
    .collect();

  const blockSessions = (
    await Promise.all(
      placements.map(async (placement) => {
        const row = await ctx.db.get(placement.sessionId);
        return row ? toBlockingSession(row) : null;
      }),
    )
  ).filter((s): s is NonNullable<typeof s> => s !== null);

  if (blockSessions.length === 0) return null;

  const discipline =
    blockSessions[0]?.primaryDiscipline ??
    blockSessions[0]?.disciplines[0] ??
    "general";
  const blockModel = blockFromSessions(
    blockSessions,
    discipline,
    block.label ?? "Block",
    `block_${blockId}`,
  );

  const sessionProfile = await ctx.db
    .query("sessionAiProfiles")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .first();

  const embeddings = new Map<string, number[]>();
  if (sessionProfile?.embedding) {
    embeddings.set(mappedSession.id, sessionProfile.embedding);
  }

  for (const s of blockSessions) {
    const row = await ctx.db
      .query("sessions")
      .withIndex("by_sessionizeId", (q) => q.eq("sessionizeId", s.id))
      .first();
    if (!row) continue;
    const profile = await ctx.db
      .query("sessionAiProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", row._id))
      .first();
    if (profile?.embedding) embeddings.set(s.id, profile.embedding);
  }

  return scoreSessionFit(mappedSession, blockModel, embeddings);
}
