import { z } from "zod";

export const disciplineAssignmentSchema = z.object({
  id: z.string().min(1),
  primaryDiscipline: z.string().min(1),
  keywords: z.array(z.string()).default([]),
});

export const disciplineAssignmentResponseSchema = z.object({
  assignments: z.array(disciplineAssignmentSchema).min(1),
});

export const initialBlockSchema = z.object({
  sessionIds: z.array(z.string()).min(1).max(3),
  primaryDiscipline: z.string().min(1),
  rationale: z.string(),
});

export const initialGroupingResponseSchema = z.object({
  blocks: z.array(initialBlockSchema).min(1),
});

export const blockCompletionResponseSchema = z.object({
  addSessionId: z.string().nullable(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
});

export const criticReviewSchema = z.object({
  blockId: z.string().min(1),
  coherent: z.boolean(),
  issue: z.string().nullable(),
  suggestion: z.string().nullable(),
});

export const criticResponseSchema = z.object({
  reviews: z.array(criticReviewSchema).min(1),
});
