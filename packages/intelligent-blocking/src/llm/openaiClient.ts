import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import type { BlockingLLMClient } from "./client.js";

export type OpenAIClientConfig = {
  apiKey: string;
  model?: string;
  embeddingModel?: string;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

function toTokenUsage(usage: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) {
  return {
    promptTokens: usage.promptTokens ?? 0,
    completionTokens: usage.completionTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

/** Creates an OpenAI-backed LLM client for blocking orchestration. */
export function createOpenAIClient(config: OpenAIClientConfig): BlockingLLMClient {
  const openai = createOpenAI({ apiKey: config.apiKey });
  const modelId = config.model ?? DEFAULT_MODEL;
  const embeddingModelId = config.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;

  return {
    async generateJson({ system, prompt, schema, temperature = 0.4 }) {
      const { object, usage } = await generateObject({
        model: openai(modelId),
        schema,
        system,
        prompt,
        temperature,
        maxRetries: 0,
      });
      return { object, usage: toTokenUsage(usage) };
    },

    async getEmbedding(text: string) {
      const { embedding, usage } = await embed({
        model: openai.embedding(embeddingModelId),
        value: text,
      });
      return embedding;
    },
  };
}
