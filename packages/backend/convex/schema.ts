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
    language: v.optional(v.union(v.string(), v.null())),
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
            field: v.optional(v.union(v.string(), v.null())),
          }),
        ),
        totalMinutes: v.number(),
        warnings: v.optional(
          v.array(
            v.object({
              code: v.string(),
              message: v.string(),
            }),
          ),
        ),
      }),
    ),
    report: v.optional(
      v.object({
        inputSessionCount: v.number(),
        groupedSessionCount: v.number(),
        uncoveredSessions: v.array(
          v.object({
            sessionizeId: v.string(),
            title: v.string(),
          }),
        ),
        duplicateSessionIds: v.array(
          v.object({
            sessionizeId: v.string(),
            keptInGroupTitle: v.string(),
            duplicateInGroupTitle: v.string(),
          }),
        ),
        invalidSessionIds: v.array(v.string()),
      }),
    ),
    scope: v.optional(
      v.union(
        v.literal("full"),
        v.literal("page_unassigned"),
        v.literal("page_regroup"),
        v.literal("block_complete"),
        v.literal("block_review"),
      ),
    ),
    programPageId: v.optional(v.id("programPages")),
    metadata: v.optional(
      v.object({
        inputSessionCount: v.number(),
        assignedSessionCount: v.number(),
        blockCount: v.number(),
        unassignedCount: v.number(),
        scope: v.optional(v.string()),
        stages: v.array(
          v.object({
            name: v.string(),
            durationMs: v.number(),
            usage: v.object({
              promptTokens: v.number(),
              completionTokens: v.number(),
              totalTokens: v.number(),
            }),
            details: v.optional(v.any()),
          }),
        ),
        sessionTraces: v.array(
          v.object({
            sessionId: v.string(),
            primaryDiscipline: v.string(),
            keywords: v.array(v.string()),
            poolId: v.optional(v.string()),
            embeddingText: v.string(),
            stage: v.string(),
            blockId: v.optional(v.string()),
            rationale: v.optional(v.string()),
            confidence: v.optional(v.number()),
          }),
        ),
        criticFlags: v.array(
          v.object({
            blockId: v.string(),
            issue: v.string(),
            suggestion: v.union(v.string(), v.null()),
            regenerated: v.boolean(),
          }),
        ),
      }),
    ),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
  sessionAiProfiles: defineTable({
    sessionId: v.id("sessions"),
    primaryDiscipline: v.string(),
    keywords: v.array(v.string()),
    embeddingText: v.string(),
    embedding: v.array(v.float64()),
    enrichedAt: v.number(),
    model: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),
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
