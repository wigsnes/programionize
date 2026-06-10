import { describe, expect, it } from "vitest";
import { initialGroupingResponseSchema } from "./schemas/llmOutputs.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { runReconciliation } from "./reconciliation.js";
import type { Session } from "./types.js";

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
  return {
    async getEmbedding() {
      return [1, 0, 0];
    },
    async generateJson(opts) {
      const ids =
        opts.prompt.match(/id=(\w+)/g)?.map((match) => match.slice(3)) ?? [];
      return {
        object: initialGroupingResponseSchema.parse({
          blocks: [
            {
              sessionIds: ids,
              primaryDiscipline: "backend",
              rationale: "Reconciled block",
            },
          ],
        }),
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  } as BlockingLLMClient;
}

describe("runReconciliation", () => {
  it("places orphaned sessions into valid blocks", async () => {
    const sessions = [
      makeSession("s1", "backend", 30),
      makeSession("s2", "backend", 30),
      makeSession("s3", "backend", 30),
    ];
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const assignedIds = new Set<string>();

    const result = await runReconciliation(
      sessions,
      assignedIds,
      sessionById,
      mockClient(),
    );

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.assignedIds.size).toBe(3);
    expect(result.stages.some((stage) => stage.name === "reconciliation_pass_1")).toBe(
      true,
    );
  });

  it("rejects blocks that exceed the 90 minute cap", async () => {
    const sessions = [
      makeSession("s1", "backend", 60),
      makeSession("s2", "backend", 45),
    ];
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const assignedIds = new Set<string>();

    const result = await runReconciliation(
      sessions,
      assignedIds,
      sessionById,
      mockClient(),
    );

    expect(result.assignedIds.size).toBe(0);
    expect(result.blocks.length).toBe(0);
  });
});
