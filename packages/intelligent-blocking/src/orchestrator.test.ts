import { describe, expect, it } from "vitest";
import {
  blockCompletionResponseSchema,
  criticResponseSchema,
  initialGroupingResponseSchema,
} from "./schemas/llmOutputs.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { buildIntelligentBlocks } from "./orchestrator.js";
import type { Session } from "./types.js";

function makeSession(
  id: string,
  discipline: string,
  duration: 15 | 30 | 45 | 60,
): Session {
  return {
    id,
    title: `${discipline} talk ${id}`,
    description: `Description for ${id}`,
    duration,
    disciplines: [discipline],
    keywords: [discipline],
    primaryDiscipline: discipline,
  };
}

function mockClient(responses?: {
  groupingSessionIds?: string[][];
}): BlockingLLMClient {
  let call = 0;

  return {
    async getEmbedding(text: string) {
      const hash = text.length % 5;
      const vector = [0, 0, 0, 0, 0];
      vector[hash] = 1;
      return vector;
    },

    async generateJson(opts) {
      call += 1;
      const { prompt } = opts;

      if (prompt.includes("Pool discipline:") || prompt.includes("not placed yet")) {
        const ids =
          prompt.match(/id=(\w+)/g)?.map((match) => match.slice(3)) ?? [];
        const groups =
          responses?.groupingSessionIds ??
          [ids.slice(0, 2), ids.slice(2)].filter((group) => group.length > 0);

        return {
          object: initialGroupingResponseSchema.parse({
            blocks: groups.map((sessionIds, index) => ({
              sessionIds,
              primaryDiscipline: index === 0 ? "backend" : "design",
              rationale: `Grouped block ${index + 1}`,
            })),
          }),
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      }

      if (prompt.includes("Current partial block:")) {
        return {
          object: blockCompletionResponseSchema.parse({
            addSessionId: null,
            rationale: "No good fit",
            confidence: 0.7,
          }),
          usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        };
      }

      if (prompt.includes("Review these finished blocks:")) {
        const blockIds =
          prompt
            .match(/Block id=(block_[^\s]+)/g)
            ?.map((match) => match.replace("Block id=", "")) ?? ["block_x"];
        return {
          object: criticResponseSchema.parse({
            reviews: blockIds.map((blockId) => ({
              blockId,
              coherent: true,
              issue: null,
              suggestion: null,
            })),
          }),
          usage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 },
        };
      }

      throw new Error(`Unexpected prompt on call ${call}`);
    },
  } as BlockingLLMClient;
}

describe("buildIntelligentBlocks", () => {
  it("returns blocks and metadata for a small session set", async () => {
    const sessions = [
      makeSession("s1", "backend", 30),
      makeSession("s2", "backend", 45),
      makeSession("s3", "design", 60),
    ];

    const result = await buildIntelligentBlocks(sessions, {
      llm: mockClient(),
    });

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.metadata.inputSessionCount).toBe(3);
    expect(
      result.metadata.stages.some((stage) => stage.name === "preprocessing"),
    ).toBe(true);
  });

  it("preserves existing blocks and skips locked sessions", async () => {
    const existing = [
      {
        id: "block_existing",
        sessions: [makeSession("s1", "backend", 30)],
        totalDuration: 30,
        primaryDiscipline: "backend",
        rationale: "Existing block",
      },
    ];

    const result = await buildIntelligentBlocks(
      [makeSession("s1", "backend", 30), makeSession("s2", "backend", 45)],
      {
        llm: mockClient({ groupingSessionIds: [["s2"]] }),
        options: {
          existingBlocks: existing,
          lockedSessionIds: ["s1"],
        },
      },
    );

    expect(result.blocks.some((block) => block.id === "block_existing")).toBe(
      true,
    );
  });
});
