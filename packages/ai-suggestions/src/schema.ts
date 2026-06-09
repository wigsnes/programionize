import { z } from "zod";

export const rawSuggestedGroupSchema = z.object({
  title: z.string().min(1),
  rationale: z.string(),
  sessionizeIds: z.array(z.string()).min(1).max(3),
});

export const suggestionsModelSchema = z.object({
  groups: z.array(rawSuggestedGroupSchema).min(1),
});
