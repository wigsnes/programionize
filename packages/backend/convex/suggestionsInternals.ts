import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const suggestedGroupValidator = v.object({
  title: v.string(),
  rationale: v.string(),
  sessions: v.array(
    v.object({
      sessionizeId: v.string(),
      title: v.string(),
      lengthMinutes: v.union(v.number(), v.null()),
    }),
  ),
  totalMinutes: v.number(),
});

export const listForPrompt = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map((session) => ({
      sessionizeId: session.sessionizeId,
      title: session.title,
      description: session.description,
      lengthMinutes: session.lengthMinutes,
      sessionizeStatus: session.sessionizeStatus,
      status: session.status,
      isServiceSession: session.isServiceSession,
      showInCatalog: session.showInCatalog,
    }));
  },
});

export const storeRun = internalMutation({
  args: {
    groups: v.array(suggestedGroupValidator),
    createdAt: v.number(),
  },
  handler: async (ctx, { groups, createdAt }) => {
    await ctx.db.insert("aiSuggestionRuns", { groups, createdAt });
    return { stored: true as const };
  },
});
