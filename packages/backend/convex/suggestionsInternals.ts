import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const suggestedGroupValidator = v.object({
  title: v.string(),
  rationale: v.string(),
  sessions: v.array(
    v.object({
      sessionizeId: v.string(),
      title: v.string(),
      lengthMinutes: v.union(v.number(), v.null()),
      field: v.union(v.string(), v.null()),
    }),
  ),
  totalMinutes: v.number(),
  warnings: v.array(
    v.object({
      code: v.string(),
      message: v.string(),
    }),
  ),
});

const reportValidator = v.object({
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
});

const metadataValidator = v.object({
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
});

export const listForPrompt = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map((session) => ({
      sessionizeId: session.sessionizeId,
      title: session.title,
      description: session.description,
      lengthMinutes: session.lengthMinutes,
      field: session.field,
      speakerNames: session.speakerNames,
      sessionizeStatus: session.sessionizeStatus,
      status: session.status,
      isServiceSession: session.isServiceSession,
      showInCatalog: session.showInCatalog,
    }));
  },
});

export const storeRun = internalMutation({
  args: {
    groups: v.array(suggestedGroupValidator),
    report: reportValidator,
    model: v.optional(v.string()),
    createdAt: v.number(),
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
    metadata: v.optional(metadataValidator),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiSuggestionRuns", args);
    return { stored: true as const };
  },
});
