import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { SuggestionInputSession } from "@programionize/ai-suggestions";
import type { Session } from "@programionize/intelligent-blocking";
import { loadSchedulableSessions, type DbSessionRow } from "./lib/aiShared";

export const listSchedulable = internalQuery({
  args: {},
  handler: async (ctx): Promise<{
    rows: DbSessionRow[];
    inputs: SuggestionInputSession[];
    blocking: Session[];
    skippedIds: string[];
  }> => loadSchedulableSessions(ctx),
});

export const upsertProfile = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    primaryDiscipline: v.string(),
    keywords: v.array(v.string()),
    embeddingText: v.string(),
    embedding: v.array(v.float64()),
    enrichedAt: v.number(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessionAiProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        primaryDiscipline: args.primaryDiscipline,
        keywords: args.keywords,
        embeddingText: args.embeddingText,
        embedding: args.embedding,
        enrichedAt: args.enrichedAt,
        model: args.model,
      });
      return existing._id;
    }

    return await ctx.db.insert("sessionAiProfiles", args);
  },
});

export const getProfile = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("sessionAiProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
  },
});

export const listProfiles = internalQuery({
  args: { sessionIds: v.array(v.id("sessions")) },
  handler: async (ctx, { sessionIds }) => {
    const profiles = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const profile = await ctx.db
          .query("sessionAiProfiles")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .first();
        return profile ? { ...profile, sessionId: profile.sessionId } : null;
      }),
    );
    return profiles.filter((p) => p !== null);
  },
});
