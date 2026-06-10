import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import { requireAccess } from "./lib/requireAccess";

async function assignSessionToBlock(
  ctx: MutationCtx,
  blockId: Id<"blocks">,
  sessionId: Id<"sessions">,
  insertAtIndex: number,
) {
  const block = await ctx.db.get(blockId);
  if (!block) throw new Error("Block not found");

  const session = await ctx.db.get(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.isServiceSession) {
    throw new Error("Service sessions cannot be scheduled");
  }

  const existingOnPage = await ctx.db
    .query("blockSessions")
    .withIndex("by_page_and_session", (q) =>
      q.eq("programPageId", block.programPageId).eq("sessionId", sessionId),
    )
    .collect();
  for (const placement of existingOnPage) {
    await ctx.db.delete(placement._id);
  }

  const inBlock = await ctx.db
    .query("blockSessions")
    .withIndex("by_block", (q) => q.eq("blockId", blockId))
    .collect();
  const sorted = inBlock.sort((a, b) => a.sortOrder - b.sortOrder);
  const targetIndex = Math.max(0, Math.min(insertAtIndex, sorted.length));

  for (let i = 0; i < sorted.length; i++) {
    const nextOrder = i >= targetIndex ? i + 1 : i;
    if (sorted[i].sortOrder !== nextOrder) {
      await ctx.db.patch(sorted[i]._id, { sortOrder: nextOrder });
    }
  }

  await ctx.db.insert("blockSessions", {
    programPageId: block.programPageId,
    blockId,
    sessionId,
    sortOrder: targetIndex,
  });
}

async function createBlockWithLabel(
  ctx: MutationCtx,
  programPageId: Id<"programPages">,
  label: string,
): Promise<Id<"blocks">> {
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_page", (q) => q.eq("programPageId", programPageId))
    .collect();
  const nextOrder =
    blocks.reduce((max, block) => Math.max(max, block.sortOrder), -1) + 1;

  return await ctx.db.insert("blocks", {
    programPageId,
    sortOrder: nextOrder,
    label: label.trim() || `Block ${nextOrder + 1}`,
  });
}

export const applySuggestionGroup = mutation({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    groupTitle: v.string(),
    sessionizeIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAccess(ctx, args.sessionToken);

    const page = await ctx.db.get(args.programPageId);
    if (!page) throw new Error("Page not found");

    const blockId = await createBlockWithLabel(
      ctx,
      args.programPageId,
      args.groupTitle,
    );

    const assigned: string[] = [];
    const skipped: { sessionizeId: string; reason: string }[] = [];
    let moved = 0;

    for (let index = 0; index < args.sessionizeIds.length; index++) {
      const sessionizeId = args.sessionizeIds[index];
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_sessionizeId", (q) => q.eq("sessionizeId", sessionizeId))
        .first();

      if (!session) {
        skipped.push({ sessionizeId, reason: "Session not found" });
        continue;
      }
      if (session.status === "removed") {
        skipped.push({ sessionizeId, reason: "Session removed from Sessionize" });
        continue;
      }
      if (session.isServiceSession) {
        skipped.push({ sessionizeId, reason: "Service session" });
        continue;
      }

      const existing = await ctx.db
        .query("blockSessions")
        .withIndex("by_page_and_session", (q) =>
          q
            .eq("programPageId", args.programPageId)
            .eq("sessionId", session._id),
        )
        .first();
      if (existing) moved += 1;

      await assignSessionToBlock(ctx, blockId, session._id, index);
      assigned.push(sessionizeId);
    }

    return { blockId, assigned, skipped, moved };
  },
});

export const applyAllSuggestionGroups = mutation({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    groups: v.array(
      v.object({
        title: v.string(),
        sessionizeIds: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAccess(ctx, args.sessionToken);

    const page = await ctx.db.get(args.programPageId);
    if (!page) throw new Error("Page not found");

    const results: {
      blockId: Id<"blocks">;
      title: string;
      assigned: number;
      moved: number;
    }[] = [];

    for (const group of args.groups) {
      const blockId = await createBlockWithLabel(
        ctx,
        args.programPageId,
        group.title,
      );

      let assigned = 0;
      let moved = 0;

      for (let index = 0; index < group.sessionizeIds.length; index++) {
        const sessionizeId = group.sessionizeIds[index];
        const session = await ctx.db
          .query("sessions")
          .withIndex("by_sessionizeId", (q) =>
            q.eq("sessionizeId", sessionizeId),
          )
          .first();
        if (!session || session.isServiceSession || session.status === "removed") {
          continue;
        }

        const existing = await ctx.db
          .query("blockSessions")
          .withIndex("by_page_and_session", (q) =>
            q
              .eq("programPageId", args.programPageId)
              .eq("sessionId", session._id),
          )
          .first();
        if (existing) moved += 1;

        await assignSessionToBlock(ctx, blockId, session._id, index);
        assigned += 1;
      }

      results.push({ blockId, title: group.title, assigned, moved });
    }

    return { results };
  },
});
