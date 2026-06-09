import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  eventConfig: defineTable({
    sessionizeEventId: v.string(),
    lastImportAt: v.number(),
  }),
  sessions: defineTable({
    sessionizeId: v.string(),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    field: v.union(v.string(), v.null()),
    lengthMinutes: v.union(v.number(), v.null()),
    isServiceSession: v.boolean(),
    speakerNames: v.array(v.string()),
    sessionizeStatus: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("removed")),
    showInCatalog: v.optional(v.boolean()),
    updatedAt: v.number(),
  }).index("by_sessionizeId", ["sessionizeId"]),
  magicLinks: defineTable({
    tokenHash: v.string(),
    label: v.union(v.string(), v.null()),
    createdAt: v.number(),
    expiresAt: v.union(v.number(), v.null()),
    revokedAt: v.union(v.number(), v.null()),
  }).index("by_tokenHash", ["tokenHash"]),
  accessSessions: defineTable({
    sessionToken: v.string(),
    magicLinkId: v.id("magicLinks"),
    createdAt: v.number(),
    expiresAt: v.union(v.number(), v.null()),
  }).index("by_sessionToken", ["sessionToken"]),
  programPages: defineTable({
    name: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
  }),
  blocks: defineTable({
    programPageId: v.id("programPages"),
    sortOrder: v.number(),
    label: v.union(v.string(), v.null()),
  }).index("by_page", ["programPageId"]),
  aiSuggestionRuns: defineTable({
    groups: v.array(
      v.object({
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
      }),
    ),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
  blockSessions: defineTable({
    programPageId: v.id("programPages"),
    blockId: v.id("blocks"),
    sessionId: v.id("sessions"),
    sortOrder: v.number(),
  })
    .index("by_page_and_session", ["programPageId", "sessionId"])
    .index("by_block", ["blockId"])
    .index("by_session", ["sessionId"]),
});
