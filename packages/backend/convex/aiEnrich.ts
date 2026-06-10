"use node";

import {
  buildSessionEmbeddingText,
  createBlockingClientFromEnv,
  preprocessSessions,
  type Session,
} from "@programionize/intelligent-blocking";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, action } from "./_generated/server";
import { modelIdFromEnv } from "./lib/aiShared";

const PROFILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const enrichProfilesInternal = internalAction({
  args: {
    sessionToken: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, force }): Promise<{
    enriched: number;
    skipped: number;
    total: number;
  }> => {
    await ctx.runQuery(internal.access.assertAccess, { sessionToken });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const schedulable = await ctx.runQuery(internal.aiInternals.listSchedulable);
    const { blocking, rows } = schedulable;
    const client = createBlockingClientFromEnv(process.env);
    const modelId = modelIdFromEnv();
    const now = Date.now();
    let enriched = 0;
    let skipped = 0;

    for (const row of rows) {
      const existing = await ctx.runQuery(internal.aiInternals.getProfile, {
        sessionId: row._id,
      });
      if (
        !force &&
        existing &&
        now - existing.enrichedAt < PROFILE_MAX_AGE_MS
      ) {
        skipped += 1;
        continue;
      }

      const session = blocking.find((s: Session) => s.id === row.sessionizeId);
      if (!session) continue;

      const pre = await preprocessSessions([session], client);
      const enrichedSession = pre.enrichedSessions[0] ?? session;
      const embedding = pre.embeddings.get(session.id);
      if (!embedding) continue;

      await ctx.runMutation(internal.aiInternals.upsertProfile, {
        sessionId: row._id,
        primaryDiscipline:
          enrichedSession.primaryDiscipline ??
          enrichedSession.disciplines[0] ??
          "general",
        keywords: enrichedSession.keywords,
        embeddingText: buildSessionEmbeddingText(enrichedSession),
        embedding,
        enrichedAt: now,
        model: modelId,
      });
      enriched += 1;
    }

    return { enriched, skipped, total: rows.length };
  },
});

export const enrichProfiles = action({
  args: {
    sessionToken: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    enriched: number;
    skipped: number;
    total: number;
  }> => {
    await ctx.runQuery(internal.access.assertAccess, { sessionToken: args.sessionToken });
    return await ctx.runAction(internal.aiEnrich.enrichProfilesInternal, args);
  },
});
