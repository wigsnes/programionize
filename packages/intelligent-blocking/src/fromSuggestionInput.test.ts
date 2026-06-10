import { describe, expect, it } from "vitest";
import { fromSuggestionInput, mapSuggestionInputs } from "./adapters/fromSuggestionInput.js";
import type { SuggestionInputSession } from "@programionize/ai-suggestions";

function input(
  overrides: Partial<SuggestionInputSession> = {},
): SuggestionInputSession {
  return {
    sessionizeId: "abc123",
    title: "Building Better APIs",
    description: "Patterns for REST and GraphQL",
    lengthMinutes: 45,
    field: "Backend",
    speakerNames: ["Jane Doe"],
    ...overrides,
  };
}

describe("fromSuggestionInput", () => {
  it("maps field to disciplines", () => {
    const result = fromSuggestionInput(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.disciplines).toEqual(["backend"]);
    expect(result.session.duration).toBe(45);
    expect(result.session.keywords.length).toBeGreaterThan(0);
  });

  it("skips unsupported durations", () => {
    const result = fromSuggestionInput(input({ lengthMinutes: 90 }));
    expect(result.ok).toBe(false);
  });

  it("skips null durations", () => {
    const result = fromSuggestionInput(input({ lengthMinutes: null }));
    expect(result.ok).toBe(false);
  });
});

describe("mapSuggestionInputs", () => {
  it("partitions valid and skipped sessions", () => {
    const mapped = mapSuggestionInputs([
      input({ sessionizeId: "ok" }),
      input({ sessionizeId: "bad", lengthMinutes: null }),
    ]);
    expect(mapped.sessions).toHaveLength(1);
    expect(mapped.skipped).toHaveLength(1);
  });
});
