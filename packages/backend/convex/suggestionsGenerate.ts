"use node";

import {
  buildSuggestionPrompts,
  enrichSuggestedGroups,
  suggestionsModelSchema,
  type RawSuggestedGroup,
} from "@programionize/ai-suggestions";
import {
  effectiveShowInCatalog,
  parseSchedulableStatuses,
} from "@programionize/session-import";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { toSuggestionGenerateError } from "./lib/openaiErrors";
import { action } from "./_generated/server";

export const generate = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await ctx.runQuery(internal.access.assertAccess, { sessionToken });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const allSessions = await ctx.runQuery(
      internal.suggestionsInternals.listForPrompt,
    );
    const allowedStatuses = parseSchedulableStatuses(
      process.env.SESSIONIZE_SCHEDULABLE_STATUSES,
    );
    const schedulable = allSessions.filter(
      (session) =>
        !session.isServiceSession &&
        effectiveShowInCatalog(
          {
            status: session.status,
            isServiceSession: session.isServiceSession,
            sessionizeStatus: session.sessionizeStatus,
            showInCatalog: session.showInCatalog,
          },
          allowedStatuses,
        ),
    );

    if (schedulable.length === 0) {
      throw new Error(
        "No sessions in Accept queue or Accepted. Re-import from Sessionize, or widen SESSIONIZE_SCHEDULABLE_STATUSES on Convex.",
      );
    }

    const openai = createOpenAI({ apiKey });
    const prompts = buildSuggestionPrompts(schedulable);
    const rawGroups: RawSuggestedGroup[] = [];

    try {
      for (const prompt of prompts) {
        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: suggestionsModelSchema,
          maxRetries: 0,
          system:
            "You are helping volunteers group conference talks into ~90-minute thematic blocks. " +
            "Return JSON only. Each group has at most 3 session ids. Aim for 80–90 total minutes per group when possible.",
          prompt,
        });
        rawGroups.push(...object.groups);
      }
    } catch (error) {
      throw toSuggestionGenerateError(error);
    }

    const groups = enrichSuggestedGroups(rawGroups, schedulable);
    if (groups.length === 0) {
      throw new Error("Model returned no usable suggestion groups");
    }

    const createdAt = Date.now();
    await ctx.runMutation(internal.suggestionsInternals.storeRun, {
      groups,
      createdAt,
    });

    return { groups, createdAt } as const;
  },
});
