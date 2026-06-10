import { describe, expect, it } from "vitest";
import {
  blockCompletionResponseSchema,
  criticResponseSchema,
} from "../schemas/llmOutputs.js";
import type { BlockingLLMClient } from "../llm/client.js";
import { buildBlockFromSessions } from "../helpers/blockHelpers.js";
import { completePartialBlock } from "./blockActions.js";
import type { Session } from "../types.js";

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

function mockClient(addSessionId: string | null): BlockingLLMClient {
  return {
    async getEmbedding(text: string) {
      const vector = [0, 0, 0, 0, 0];
      vector[text.length % 5] = 1;
      return vector;
    },
    async generateJson(opts) {
      if (opts.prompt.includes("Current partial block:")) {
        return {
          object: blockCompletionResponseSchema.parse({
            addSessionId,
            rationale: addSessionId ? "Good fit" : "No good fit",
            confidence: 0.8,
          }),
          usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        };
      }

      return {
        object: criticResponseSchema.parse({
          reviews: [{ blockId: "block_x", coherent: true, issue: null, suggestion: null }],
        }),
        usage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 },
      };
    },
  } as BlockingLLMClient;
}

describe("completePartialBlock", () => {
  it("adds at most one session to a partial block", async () => {
    const block = buildBlockFromSessions(
      [makeSession("s1", "backend", 30)],
      "backend",
      "Partial block",
    );
    const candidatePool = [
      makeSession("s2", "backend", 30),
      makeSession("s3", "backend", 30),
    ];
    const assignedIds = new Set(["s1"]);

    const result = await completePartialBlock(
      { block, candidatePool, assignedIds },
      { llm: mockClient("s2") },
    );

    expect(result.blocks[0]?.sessions.map((session) => session.id)).toEqual([
      "s1",
      "s2",
    ]);
    expect(result.metadata.scope).toBe("block_complete");
  });

  it("leaves block unchanged when completion finds no fit", async () => {
    const block = buildBlockFromSessions(
      [makeSession("s1", "backend", 30)],
      "backend",
      "Partial block",
    );
    const candidatePool = [makeSession("s2", "backend", 30)];
    const assignedIds = new Set(["s1"]);

    const result = await completePartialBlock(
      { block, candidatePool, assignedIds },
      { llm: mockClient(null) },
    );

    expect(result.blocks[0]?.sessions.map((session) => session.id)).toEqual(["s1"]);
  });
});
