import {
  effectiveShowInCatalog,
  parseSchedulableStatuses,
} from "@programionize/session-import";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAccess } from "./lib/requireAccess";

export const getLatest = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    const latest = await ctx.db
      .query("aiSuggestionRuns")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
    if (!latest) return null;
    return {
      groups: latest.groups.map((group) => ({
        ...group,
        warnings: group.warnings ?? [],
        sessions: group.sessions.map((session) => ({
          ...session,
          field: session.field ?? null,
        })),
      })),
      report: latest.report ?? null,
      model: latest.model ?? null,
      createdAt: latest.createdAt,
      scope: latest.scope ?? null,
      programPageId: latest.programPageId ?? null,
      metadata: latest.metadata ?? null,
    };
  },
});

export const getSessionProfiles = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    const allowedStatuses = parseSchedulableStatuses(
      process.env.SESSIONIZE_SCHEDULABLE_STATUSES,
    );

    const sessions = await ctx.db.query("sessions").collect();
    const profiles = await ctx.db.query("sessionAiProfiles").collect();
    const profileBySessionId = new Map(
      profiles.map((profile) => [profile.sessionId, profile]),
    );

    return sessions
      .filter(
        (session) =>
          !session.isServiceSession &&
          session.status === "active" &&
          effectiveShowInCatalog(
            {
              status: session.status,
              isServiceSession: session.isServiceSession,
              sessionizeStatus: session.sessionizeStatus,
              showInCatalog: session.showInCatalog,
            },
            allowedStatuses,
          ),
      )
      .map((session) => {
        const profile = profileBySessionId.get(session._id);
        return {
          sessionId: session._id,
          sessionizeId: session.sessionizeId,
          title: session.title,
          field: session.field,
          lengthMinutes: session.lengthMinutes,
          profile: profile
            ? {
                primaryDiscipline: profile.primaryDiscipline,
                keywords: profile.keywords,
                embeddingText: profile.embeddingText,
                enrichedAt: profile.enrichedAt,
              }
            : null,
        };
      });
  },
});

export const getPageGapAnalysis = query({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
  },
  handler: async (ctx, { sessionToken, programPageId }) => {
    await requireAccess(ctx, sessionToken);

    const page = await ctx.db.get(programPageId);
    if (!page) {
      return {
        pageName: null,
        unassigned: [] as {
          sessionizeId: string;
          title: string;
          field: string | null;
          lengthMinutes: number | null;
        }[],
      };
    }

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_page", (q) => q.eq("programPageId", programPageId))
      .collect();
    const assignedSessionIds = new Set<string>();
    for (const block of blocks) {
      const placements = await ctx.db
        .query("blockSessions")
        .withIndex("by_block", (q) => q.eq("blockId", block._id))
        .collect();
      for (const placement of placements) {
        assignedSessionIds.add(placement.sessionId);
      }
    }

    const allowedStatuses = parseSchedulableStatuses(
      process.env.SESSIONIZE_SCHEDULABLE_STATUSES,
    );

    const allSessions = await ctx.db.query("sessions").collect();
    const unassigned = allSessions
      .filter(
        (session) =>
          !session.isServiceSession &&
          session.status === "active" &&
          effectiveShowInCatalog(
            {
              status: session.status,
              isServiceSession: session.isServiceSession,
              sessionizeStatus: session.sessionizeStatus,
              showInCatalog: session.showInCatalog,
            },
            allowedStatuses,
          ) &&
          !assignedSessionIds.has(session._id),
      )
      .map((session) => ({
        sessionizeId: session.sessionizeId,
        title: session.title,
        field: session.field,
        lengthMinutes: session.lengthMinutes,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return { pageName: page.name, unassigned };
  },
});
