import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Block } from "@programionize/intelligent-blocking";
import { loadPageBlocks } from "./lib/aiShared";
import { computeSessionFitForBlock } from "./lib/sessionFit";

export const loadPageBlocksQuery = internalQuery({
  args: { programPageId: v.id("programPages") },
  handler: async (ctx, { programPageId }): Promise<Block[]> =>
    loadPageBlocks(ctx, programPageId),
});

export const computeSessionFit = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, args) => computeSessionFitForBlock(ctx, args.sessionId, args.blockId),
});
