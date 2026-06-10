"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { runGenerateFull, toSuggestionGenerateError, type StoredRunResult } from "./lib/blockingRunner";
import type { SchedulableData } from "./lib/blockingRunner";

export const generate = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<StoredRunResult> => {
    await ctx.runQuery(internal.access.assertAccess, { sessionToken });
    try {
      const data: SchedulableData = await ctx.runQuery(
        internal.aiInternals.listSchedulable,
      );
      return await runGenerateFull(ctx, sessionToken, data);
    } catch (error) {
      throw toSuggestionGenerateError(error);
    }
  },
});
