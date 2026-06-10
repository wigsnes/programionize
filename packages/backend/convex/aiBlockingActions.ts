"use node";

import { v } from "convex/values";
import type { Block } from "@programionize/intelligent-blocking";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  runCompleteBlock,
  runGenerateForPage,
  runGenerateFull,
  runReviewBlock,
  toSuggestionGenerateError,
  type SchedulableData,
  type StoredRunResult,
} from "./lib/blockingRunner";

export const generateFull = action({
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

export const generateForPage = action({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    mode: v.union(v.literal("unassigned"), v.literal("regroup")),
  },
  handler: async (ctx, args): Promise<StoredRunResult> => {
    await ctx.runQuery(internal.access.assertAccess, {
      sessionToken: args.sessionToken,
    });
    try {
      const data: SchedulableData = await ctx.runQuery(
        internal.aiInternals.listSchedulable,
      );
      const existingBlocks: Block[] = await ctx.runQuery(
        internal.aiBlockingInternals.loadPageBlocksQuery,
        { programPageId: args.programPageId },
      );
      return await runGenerateForPage(
        ctx,
        args.sessionToken,
        args.programPageId,
        args.mode,
        data,
        existingBlocks,
      );
    } catch (error) {
      throw toSuggestionGenerateError(error);
    }
  },
});

export const completeBlock = action({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, args): Promise<StoredRunResult> => {
    await ctx.runQuery(internal.access.assertAccess, {
      sessionToken: args.sessionToken,
    });
    try {
      const data: SchedulableData = await ctx.runQuery(
        internal.aiInternals.listSchedulable,
      );
      const pageBlocks: Block[] = await ctx.runQuery(
        internal.aiBlockingInternals.loadPageBlocksQuery,
        { programPageId: args.programPageId },
      );
      const target: Block | undefined = pageBlocks.find(
        (block: Block) => block.id === `block_${args.blockId}`,
      );
      if (!target) throw new Error("Block not found or empty");
      return await runCompleteBlock(
        ctx,
        data,
        args.programPageId,
        target,
        pageBlocks,
      );
    } catch (error) {
      throw toSuggestionGenerateError(error);
    }
  },
});

export const reviewBlock = action({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, args): Promise<StoredRunResult> => {
    await ctx.runQuery(internal.access.assertAccess, {
      sessionToken: args.sessionToken,
    });
    try {
      const data: SchedulableData = await ctx.runQuery(
        internal.aiInternals.listSchedulable,
      );
      const pageBlocks: Block[] = await ctx.runQuery(
        internal.aiBlockingInternals.loadPageBlocksQuery,
        { programPageId: args.programPageId },
      );
      const target: Block | undefined = pageBlocks.find(
        (block: Block) => block.id === `block_${args.blockId}`,
      );
      if (!target) throw new Error("Block not found or empty");
      return await runReviewBlock(
        ctx,
        data,
        args.programPageId,
        target,
        pageBlocks,
      );
    } catch (error) {
      throw toSuggestionGenerateError(error);
    }
  },
});
