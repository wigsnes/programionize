import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import type { BlockingLLMClient } from "./client.js";
import type { OpenAIClientConfig } from "./openaiClient.js";
import { createOpenAIClient } from "./openaiClient.js";

export type AnthropicClientConfig = {
  apiKey: string;
  model?: string;
  embeddingClient?: BlockingLLMClient;
};

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

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

/**
 * Creates an Anthropic-backed LLM client. Embeddings still use OpenAI unless
 * an embeddingClient is provided.
 */
export function createAnthropicClient(
  config: AnthropicClientConfig,
): BlockingLLMClient {
  const anthropic = createAnthropic({ apiKey: config.apiKey });
  const modelId = config.model ?? DEFAULT_MODEL;

  if (!config.embeddingClient) {
    throw new Error(
      "Anthropic client requires an embeddingClient (OpenAI) for vector similarity",
    );
  }

  return {
    async generateJson({ system, prompt, schema, temperature = 0.4 }) {
      const { object, usage } = await generateObject({
        model: anthropic(modelId),
        schema,
        system,
        prompt,
        temperature,
        maxRetries: 0,
      });
      return { object, usage: toTokenUsage(usage) };
    },

    getEmbedding(text: string) {
      return config.embeddingClient!.getEmbedding(text);
    },
  };
}

export type BlockingClientEnv = {
  LLM_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_EMBEDDING_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

/** Builds the appropriate LLM client from environment variables. */
export function createBlockingClientFromEnv(
  env: BlockingClientEnv,
): BlockingLLMClient {
  const provider = env.LLM_PROVIDER ?? "openai";

  if (provider === "anthropic") {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    if (!env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is required for embeddings when using Anthropic",
      );
    }
    const embeddingClient = createOpenAIClient({
      apiKey: env.OPENAI_API_KEY,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL,
    });
    return createAnthropicClient({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
      embeddingClient,
    });
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return createOpenAIClient({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    embeddingModel: env.OPENAI_EMBEDDING_MODEL,
  });
}

export type { OpenAIClientConfig };
