import { describe, expect, it } from "vitest";
import {
  buildBlockFromSessions,
  calculateTotalDuration,
  validateBlock,
} from "./helpers/blockHelpers.js";
import type { Session } from "./types.js";

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    title: "Test Session",
    description: "A test session",
    duration: 30,
    disciplines: ["backend"],
    keywords: ["test"],
    ...overrides,
  };
}

describe("validateBlock", () => {
  it("accepts three sessions totaling 90 minutes", () => {
    const block = buildBlockFromSessions(
      [
        session({ id: "a", duration: 30 }),
        session({ id: "b", duration: 30 }),
        session({ id: "c", duration: 30 }),
      ],
      "backend",
      "valid block",
    );
    expect(validateBlock(block).valid).toBe(true);
    expect(calculateTotalDuration(block.sessions)).toBe(90);
  });

  it("rejects four sessions", () => {
    const block = buildBlockFromSessions(
      [
        session({ id: "a", duration: 15 }),
        session({ id: "b", duration: 15 }),
        session({ id: "c", duration: 15 }),
        session({ id: "d", duration: 15 }),
      ],
      "backend",
      "too many",
    );
    expect(validateBlock(block).valid).toBe(false);
  });

  it("rejects duration over 90 minutes", () => {
    const block = buildBlockFromSessions(
      [session({ id: "a", duration: 60 }), session({ id: "b", duration: 45 })],
      "backend",
      "too long",
    );
    expect(validateBlock(block).valid).toBe(false);
  });
});
