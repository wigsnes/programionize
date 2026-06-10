import {
  applyImportDiff,
  mapAllSessions,
  type ExistingSession,
  type ImportedSession,
} from "@programionize/session-import";
import { getAll } from "sessionize_api";
import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAccess } from "./lib/requireAccess";

const importedSessionValidator = v.object({
  sessionizeId: v.string(),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  field: v.union(v.string(), v.null()),
  language: v.optional(v.union(v.string(), v.null())),
  lengthMinutes: v.union(v.number(), v.null()),
  isServiceSession: v.boolean(),
  speakerNames: v.array(v.string()),
  sessionizeStatus: v.optional(v.string()),
  status: v.union(v.literal("active"), v.literal("removed")),
});

export const listExisting = internalQuery({
  args: {},
  handler: async (ctx): Promise<ExistingSession[]> => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map((session) => ({
      sessionizeId: session.sessionizeId,
      status: session.status,
    }));
  },
});

export const applyImport = internalMutation({
  args: {
    sessionizeEventId: v.string(),
    upserts: v.array(importedSessionValidator),
    markRemovedIds: v.array(v.string()),
  },
  handler: async (ctx, { sessionizeEventId, upserts, markRemovedIds }) => {
    const now = Date.now();

    for (const session of upserts) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_sessionizeId", (q) =>
          q.eq("sessionizeId", session.sessionizeId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...session,
          showInCatalog: existing.showInCatalog,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("sessions", { ...session, updatedAt: now });
      }
    }

    for (const sessionizeId of markRemovedIds) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_sessionizeId", (q) => q.eq("sessionizeId", sessionizeId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { status: "removed", updatedAt: now });
      }
    }

    const config = await ctx.db.query("eventConfig").first();
    if (config) {
      await ctx.db.patch(config._id, { lastImportAt: now });
    } else {
      await ctx.db.insert("eventConfig", {
        sessionizeEventId,
        lastImportAt: now,
      });
    }

    return {
      upserted: upserts.length,
      removed: markRemovedIds.length,
    } as const;
  },
});

function mapSession(session: {
  _id: { toString(): string };
  sessionizeId: string;
  title: string;
  description: string | null;
  field: string | null;
  language?: string | null;
  lengthMinutes: number | null;
  isServiceSession: boolean;
  speakerNames: string[];
  sessionizeStatus?: string;
  status: "active" | "removed";
  showInCatalog?: boolean;
}) {
  return {
    _id: session._id,
    sessionizeId: session.sessionizeId,
    title: session.title,
    description: session.description,
    field: session.field,
    language: session.language ?? null,
    lengthMinutes: session.lengthMinutes,
    isServiceSession: session.isServiceSession,
    speakerNames: session.speakerNames,
    sessionizeStatus: session.sessionizeStatus ?? null,
    status: session.status,
    showInCatalog: session.showInCatalog,
  };
}

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map(mapSession);
  },
});

export const listForAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    const sessions = await ctx.db.query("sessions").collect();
    const placementCounts = new Map<string, number>();

    for (const session of sessions) {
      const placements = await ctx.db
        .query("blockSessions")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      placementCounts.set(session._id, placements.length);
    }

    return sessions.map((session) => ({
      ...mapSession(session),
      placementCount: placementCounts.get(session._id) ?? 0,
    }));
  },
});

export const setShowInCatalog = mutation({
  args: {
    sessionToken: v.string(),
    sessionId: v.id("sessions"),
    showInCatalog: v.boolean(),
  },
  handler: async (ctx, { sessionToken, sessionId, showInCatalog }) => {
    await requireAccess(ctx, sessionToken);
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    await ctx.db.patch(sessionId, { showInCatalog, updatedAt: Date.now() });
    return { updated: true as const };
  },
});

export const importFromSessionize = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ upserted: number; removed: number }> => {
    await ctx.runQuery(internal.access.assertAccess, { sessionToken });

    const eventId = process.env.SESSIONIZE_EVENT_ID;
    if (!eventId) {
      throw new Error("SESSIONIZE_EVENT_ID is not configured");
    }

    const data = await getAll(eventId);
    const incoming: ImportedSession[] = mapAllSessions(data);
    const existing = await ctx.runQuery(internal.sessions.listExisting);
    const diff = applyImportDiff(existing, incoming);
    return await ctx.runMutation(internal.sessions.applyImport, {
      sessionizeEventId: eventId,
      ...diff,
    });
  },
});
