import type { z } from "zod";
import type { TokenUsage } from "../types.js";

export type { TokenUsage };

export type GenerateJsonOptions<T> = {
  system: string;
  prompt: string;
  schema: z.ZodSchema<T>;
  temperature?: number;
};

export type GenerateJsonResult<T> = {
  object: T;
  usage: TokenUsage;
};

export type BlockingLLMClient = {
  generateJson<T>(opts: GenerateJsonOptions<T>): Promise<GenerateJsonResult<T>>;
  getEmbedding(text: string): Promise<number[]>;
};

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

export function mergeTokenUsage(...usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (acc, usage) => ({
      promptTokens: acc.promptTokens + usage.promptTokens,
      completionTokens: acc.completionTokens + usage.completionTokens,
      totalTokens: acc.totalTokens + usage.totalTokens,
    }),
    { ...EMPTY_TOKEN_USAGE },
  );
}
