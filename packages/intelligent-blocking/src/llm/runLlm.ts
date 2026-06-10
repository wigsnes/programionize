import type { z } from "zod";
import type { BlockingLLMClient, GenerateJsonResult } from "./client.js";
import { EMPTY_TOKEN_USAGE } from "./client.js";

const MAX_JSON_RETRIES = 2;

/**
 * Calls the LLM with JSON mode and retries on malformed output up to 2 times.
 */
export async function runLLMWithJsonMode<T>(
  client: BlockingLLMClient,
  opts: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
  },
): Promise<GenerateJsonResult<T>> {
  let lastError: unknown;
  let totalUsage = { ...EMPTY_TOKEN_USAGE };

  for (let attempt = 0; attempt <= MAX_JSON_RETRIES; attempt++) {
    try {
      const result = await client.generateJson(opts);
      totalUsage = {
        promptTokens: totalUsage.promptTokens + result.usage.promptTokens,
        completionTokens:
          totalUsage.completionTokens + result.usage.completionTokens,
        totalTokens: totalUsage.totalTokens + result.usage.totalTokens,
      };
      return { object: result.object, usage: totalUsage };
    } catch (error) {
      lastError = error;
      if (attempt === MAX_JSON_RETRIES) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM JSON generation failed after retries");
}
