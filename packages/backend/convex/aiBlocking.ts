import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAccess } from "./lib/requireAccess";
import { computeSessionFitForBlock } from "./lib/sessionFit";

export const sessionFit = query({
  args: {
    sessionToken: v.string(),
    sessionId: v.id("sessions"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, { sessionToken, sessionId, blockId }) => {
    await requireAccess(ctx, sessionToken);
    return await computeSessionFitForBlock(ctx, sessionId, blockId);
  },
});

export const getFitMatrix = query({
  args: {
    sessionToken: v.string(),
    sessionId: v.id("sessions"),
    blockIds: v.array(v.id("blocks")),
  },
  handler: async (ctx, { sessionToken, sessionId, blockIds }) => {
    await requireAccess(ctx, sessionToken);
    const results: Record<
      string,
      Awaited<ReturnType<typeof computeSessionFitForBlock>>
    > = {};

    for (const blockId of blockIds) {
      results[blockId] = await computeSessionFitForBlock(ctx, sessionId, blockId);
    }
    return results;
  },
});
