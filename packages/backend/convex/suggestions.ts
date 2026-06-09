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
      groups: latest.groups,
      createdAt: latest.createdAt,
    };
  },
});
