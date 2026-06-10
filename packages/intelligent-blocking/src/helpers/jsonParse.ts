import type { z } from "zod";

export class JsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

export function parseJsonWithRetry<T>(
  raw: unknown,
  schema: z.ZodSchema<T>,
): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new JsonParseError(parsed.error.message);
  }
  return parsed.data;
}
