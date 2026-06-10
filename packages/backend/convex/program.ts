import { computeBlockTotals } from "@programionize/program-layout";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAccess } from "./lib/requireAccess";

const DEFAULT_PAGE_NAME = "Main program";

async function listPagesSorted(ctx: QueryCtx): Promise<Doc<"programPages">[]> {
  const pages = await ctx.db.query("programPages").collect();
  return pages.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getDefaultPage(
  ctx: QueryCtx,
): Promise<Doc<"programPages"> | null> {
  const pages = await listPagesSorted(ctx);
  return pages[0] ?? null;
}

async function resolvePage(
  ctx: QueryCtx,
  programPageId?: Id<"programPages">,
): Promise<Doc<"programPages"> | null> {
  if (programPageId) {
    return (await ctx.db.get(programPageId)) ?? null;
  }
  return getDefaultPage(ctx);
}

async function ensureDefaultPage(ctx: MutationCtx): Promise<Doc<"programPages">> {
  const existing = await getDefaultPage(ctx);
  if (existing) return existing;

  const pageId = await ctx.db.insert("programPages", {
    name: DEFAULT_PAGE_NAME,
    sortOrder: 0,
    createdAt: Date.now(),
  });
  const created = await ctx.db.get(pageId);
  if (!created) throw new Error("Failed to create default page");
  return created;
}

async function loadWorkspace(ctx: QueryCtx, pageId: Id<"programPages">) {
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_page", (q) => q.eq("programPageId", pageId))
    .collect();

  const sortedBlocks = blocks.sort((a, b) => a.sortOrder - b.sortOrder);
  const blockViews = [];

  for (const block of sortedBlocks) {
    const placements = await ctx.db
      .query("blockSessions")
      .withIndex("by_block", (q) => q.eq("blockId", block._id))
      .collect();

    const ordered = placements.sort((a, b) => a.sortOrder - b.sortOrder);
    const sessions = [];
    for (const placement of ordered) {
      const session = await ctx.db.get(placement.sessionId);
      if (!session) continue;
      sessions.push({
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
      });
    }

    const totals = computeBlockTotals(sessions);
    blockViews.push({
      _id: block._id,
      label: block.label,
      sortOrder: block.sortOrder,
      sessions,
      sessionCount: totals.sessionCount,
      totalMinutes: totals.totalMinutes,
    });
  }

  return blockViews;
}

export const listPages = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    const pages = await listPagesSorted(ctx);
    return pages.map((page) => ({
      _id: page._id,
      name: page.name,
      sortOrder: page.sortOrder,
    }));
  },
});

export const getWorkspace = query({
  args: {
    sessionToken: v.string(),
    programPageId: v.optional(v.id("programPages")),
  },
  handler: async (ctx, { sessionToken, programPageId }) => {
    await requireAccess(ctx, sessionToken);
    const page = await resolvePage(ctx, programPageId);
    if (!page) {
      return {
        page: { _id: null, name: DEFAULT_PAGE_NAME },
        blocks: [],
        assignedSessionIds: [],
      };
    }

    const blocks = await loadWorkspace(ctx, page._id);
    return {
      page: { _id: page._id, name: page.name },
      blocks,
      assignedSessionIds: blocks.flatMap((block) =>
        block.sessions.map((session) => session._id),
      ),
    };
  },
});

export const createPage = mutation({
  args: { sessionToken: v.string(), name: v.string() },
  handler: async (ctx, { sessionToken, name }) => {
    await requireAccess(ctx, sessionToken);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Page name is required");

    const pages = await listPagesSorted(ctx);
    const nextOrder =
      pages.reduce((max, page) => Math.max(max, page.sortOrder), -1) + 1;

    const pageId = await ctx.db.insert("programPages", {
      name: trimmed,
      sortOrder: nextOrder,
      createdAt: Date.now(),
    });

    return { pageId };
  },
});

export const renamePage = mutation({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
    name: v.string(),
  },
  handler: async (ctx, { sessionToken, programPageId, name }) => {
    await requireAccess(ctx, sessionToken);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Page name is required");

    const page = await ctx.db.get(programPageId);
    if (!page) throw new Error("Page not found");

    await ctx.db.patch(programPageId, { name: trimmed });
    return { renamed: true as const };
  },
});

export const deletePage = mutation({
  args: {
    sessionToken: v.string(),
    programPageId: v.id("programPages"),
  },
  handler: async (ctx, { sessionToken, programPageId }) => {
    await requireAccess(ctx, sessionToken);
    const pages = await listPagesSorted(ctx);
    if (pages.length <= 1) {
      throw new Error("Cannot delete the last program page");
    }

    const page = await ctx.db.get(programPageId);
    if (!page) throw new Error("Page not found");

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_page", (q) => q.eq("programPageId", programPageId))
      .collect();

    for (const block of blocks) {
      const placements = await ctx.db
        .query("blockSessions")
        .withIndex("by_block", (q) => q.eq("blockId", block._id))
        .collect();
      for (const placement of placements) {
        await ctx.db.delete(placement._id);
      }
      await ctx.db.delete(block._id);
    }

    await ctx.db.delete(programPageId);
    return { deleted: true as const };
  },
});

export const createBlock = mutation({
  args: {
    sessionToken: v.string(),
    programPageId: v.optional(v.id("programPages")),
  },
  handler: async (ctx, { sessionToken, programPageId }) => {
    await requireAccess(ctx, sessionToken);
    const page = programPageId
      ? await ctx.db.get(programPageId)
      : await ensureDefaultPage(ctx);
    if (!page) throw new Error("Page not found");

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_page", (q) => q.eq("programPageId", page._id))
      .collect();
    const nextOrder =
      blocks.reduce((max, block) => Math.max(max, block.sortOrder), -1) + 1;

    const blockId = await ctx.db.insert("blocks", {
      programPageId: page._id,
      sortOrder: nextOrder,
      label: `Block ${nextOrder + 1}`,
    });

    return { blockId };
  },
});

export const renameBlock = mutation({
  args: {
    sessionToken: v.string(),
    blockId: v.id("blocks"),
    label: v.string(),
  },
  handler: async (ctx, { sessionToken, blockId, label }) => {
    await requireAccess(ctx, sessionToken);
    const trimmed = label.trim();
    if (!trimmed) throw new Error("Block name is required");

    const block = await ctx.db.get(blockId);
    if (!block) throw new Error("Block not found");

    await ctx.db.patch(blockId, { label: trimmed });
    return { renamed: true as const };
  },
});

export const removeBlock = mutation({
  args: { sessionToken: v.string(), blockId: v.id("blocks") },
  handler: async (ctx, { sessionToken, blockId }) => {
    await requireAccess(ctx, sessionToken);
    const placements = await ctx.db
      .query("blockSessions")
      .withIndex("by_block", (q) => q.eq("blockId", blockId))
      .collect();
    for (const placement of placements) {
      await ctx.db.delete(placement._id);
    }
    await ctx.db.delete(blockId);
    return { removed: true as const };
  },
});

export const assignSession = mutation({
  args: {
    sessionToken: v.string(),
    blockId: v.id("blocks"),
    sessionId: v.id("sessions"),
    insertAtIndex: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, blockId, sessionId, insertAtIndex }) => {
    await requireAccess(ctx, sessionToken);
    const block = await ctx.db.get(blockId);
    if (!block) throw new Error("Block not found");

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
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
    const targetIndex =
      insertAtIndex === undefined
        ? sorted.length
        : Math.max(0, Math.min(insertAtIndex, sorted.length));

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

    return { assigned: true as const };
  },
});

export const unassignSession = mutation({
  args: {
    sessionToken: v.string(),
    sessionId: v.id("sessions"),
    programPageId: v.optional(v.id("programPages")),
  },
  handler: async (ctx, { sessionToken, sessionId, programPageId }) => {
    await requireAccess(ctx, sessionToken);
    const page = await resolvePage(ctx, programPageId);
    if (!page) return { unassigned: true as const };

    const placements = await ctx.db
      .query("blockSessions")
      .withIndex("by_page_and_session", (q) =>
        q.eq("programPageId", page._id).eq("sessionId", sessionId),
      )
      .collect();
    for (const placement of placements) {
      await ctx.db.delete(placement._id);
    }
    return { unassigned: true as const };
  },
});
