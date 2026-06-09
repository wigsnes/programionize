import {
  generateAccessToken,
  generateMagicLinkToken,
  hashToken,
  isMagicLinkValid,
} from "@programionize/access";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAccess } from "./lib/requireAccess";

const DAY_MS = 24 * 60 * 60 * 1000;

export const createMagicLink = mutation({
  args: {
    setupSecret: v.string(),
    label: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { setupSecret, label, expiresInDays }) => {
    const expected = process.env.SETUP_SECRET?.trim();
    if (!expected || setupSecret.trim() !== expected) {
      throw new Error("Invalid setup secret");
    }

    const rawToken = generateMagicLinkToken();
    const now = Date.now();
    const expiresAt =
      expiresInDays !== undefined ? now + expiresInDays * DAY_MS : null;

    await ctx.db.insert("magicLinks", {
      tokenHash: await hashToken(rawToken),
      label: label ?? null,
      createdAt: now,
      expiresAt,
      revokedAt: null,
    });

    return {
      token: rawToken,
      path: `/access?token=${encodeURIComponent(rawToken)}`,
    };
  },
});

export const redeemMagicLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const tokenHash = await hashToken(token);
    const link = await ctx.db
      .query("magicLinks")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!link || !isMagicLinkValid(link, Date.now())) {
      throw new Error("Invalid or expired magic link");
    }

    const sessionToken = generateAccessToken();
    const sessionExpiresAt = link.expiresAt;

    await ctx.db.insert("accessSessions", {
      sessionToken,
      magicLinkId: link._id,
      createdAt: Date.now(),
      expiresAt: sessionExpiresAt,
    });

    return { sessionToken };
  },
});

export const assertAccess = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAccess(ctx, sessionToken);
    return true as const;
  },
});

export const validateSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    try {
      await requireAccess(ctx, sessionToken);
      return { valid: true as const };
    } catch {
      return { valid: false as const };
    }
  },
});

export const revokeMagicLink = mutation({
  args: {
    setupSecret: v.string(),
    magicLinkId: v.id("magicLinks"),
  },
  handler: async (ctx, { setupSecret, magicLinkId }) => {
    const expected = process.env.SETUP_SECRET?.trim();
    if (!expected || setupSecret.trim() !== expected) {
      throw new Error("Invalid setup secret");
    }

    const link = await ctx.db.get(magicLinkId);
    if (!link) throw new Error("Magic link not found");

    await ctx.db.patch(magicLinkId, { revokedAt: Date.now() });
    return { revoked: true as const };
  },
});
