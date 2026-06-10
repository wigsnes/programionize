import { describe, expect, it } from "vitest";
import {
  blockCompletionResponseSchema,
  criticResponseSchema,
  initialGroupingResponseSchema,
} from "../schemas/llmOutputs.js";
import type { BlockingLLMClient } from "../llm/client.js";
import { buildBlocksForPage } from "./pageBlocking.js";
import type { Block, Session } from "../types.js";

function makeSession(id: string, discipline: string, duration: 15 | 30 | 45 | 60): Session {
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

function mockClient(): BlockingLLMClient {
  let call = 0;
  return {
    async getEmbedding(text: string) {
      const vector = [0, 0, 0, 0, 0];
      vector[text.length % 5] = 1;
      return vector;
    },
    async generateJson(opts) {
      call += 1;
      const { prompt } = opts;

      if (prompt.includes("Pool discipline:") || prompt.includes("not placed yet")) {
        const ids =
          prompt.match(/id=(\w+)/g)?.map((match) => match.slice(3)) ?? [];
        return {
          object: initialGroupingResponseSchema.parse({
            blocks: [
              {
                sessionIds: ids,
                primaryDiscipline: "backend",
                rationale: "Grouped block",
              },
            ],
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
        return {
          object: criticResponseSchema.parse({
            reviews: [{ blockId: "block_x", coherent: true, issue: null, suggestion: null }],
          }),
          usage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 },
        };
      }

      throw new Error(`Unexpected prompt on call ${call}`);
    },
  } as BlockingLLMClient;
}

describe("buildBlocksForPage", () => {
  it("groups only unassigned catalog sessions", async () => {
    const existingBlocks: Block[] = [
      {
        id: "block_existing",
        sessions: [makeSession("s1", "backend", 30)],
        totalDuration: 30,
        primaryDiscipline: "backend",
        rationale: "Existing block",
      },
    ];

    const result = await buildBlocksForPage(
      {
        scope: "page_unassigned",
        catalogSessions: [
          makeSession("s1", "backend", 30),
          makeSession("s2", "backend", 45),
        ],
        existingBlocks,
        lockedSessionIds: ["s1"],
      },
      { llm: mockClient() },
    );

    const newGroupedIds = result.blocks
      .filter((block) => block.id !== "block_existing")
      .flatMap((block) => block.sessions.map((session) => session.id));
    expect(newGroupedIds).not.toContain("s1");
    expect(newGroupedIds).toContain("s2");
    expect(result.metadata.scope).toBe("page_unassigned");
  });

  it("locks existing block sessions during regroup", async () => {
    const existingBlocks: Block[] = [
      {
        id: "block_existing",
        sessions: [makeSession("s1", "backend", 30)],
        totalDuration: 30,
        primaryDiscipline: "backend",
        rationale: "Existing block",
      },
    ];

    const result = await buildBlocksForPage(
      {
        scope: "page_regroup",
        catalogSessions: [
          makeSession("s1", "backend", 30),
          makeSession("s2", "backend", 45),
        ],
        existingBlocks,
        lockedSessionIds: ["s1"],
      },
      { llm: mockClient() },
    );

    expect(result.blocks.some((block) => block.id === "block_existing")).toBe(true);
    expect(result.metadata.scope).toBe("page_regroup");
  });
});
