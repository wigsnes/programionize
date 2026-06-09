import { describe, expect, it } from "vitest";
import { formatSuggestionError } from "./suggestion-errors";

describe("formatSuggestionError", () => {
  it("maps OpenAI quota errors to a short message", () => {
    const err = new Error(
      "[CONVEX A(suggestionsGenerate:generate)] Uncaught AI_RetryError: Failed after 3 attempts. Last error: You exceeded your current quota, please check your plan and billing details. at _retryWithExponentialBackoff Called by client",
    );
    expect(formatSuggestionError(err)).toMatch(/quota exceeded/i);
    expect(formatSuggestionError(err)).not.toMatch(/CONVEX/);
  });
});
