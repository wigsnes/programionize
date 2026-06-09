import { describe, expect, it } from "vitest";
import { evaluateBlock } from "./evaluate-block.js";

describe("evaluateBlock", () => {
  it("warns when a block has more than three sessions", () => {
    const result = evaluateBlock([
      { lengthMinutes: 15 },
      { lengthMinutes: 15 },
      { lengthMinutes: 15 },
      { lengthMinutes: 15 },
    ]);

    expect(result.warnings).toContainEqual({
      code: "too_many_sessions",
      message: expect.stringContaining("3"),
    });
  });

  it("warns when total duration is under 80 minutes", () => {
    const result = evaluateBlock([
      { lengthMinutes: 30 },
      { lengthMinutes: 30 },
    ]);

    expect(result.warnings).toContainEqual({
      code: "duration_too_short",
      message: expect.stringContaining("80"),
    });
  });

  it("warns when total duration is over 90 minutes", () => {
    const result = evaluateBlock([
      { lengthMinutes: 60 },
      { lengthMinutes: 45 },
    ]);

    expect(result.warnings).toContainEqual({
      code: "duration_too_long",
      message: expect.stringContaining("90"),
    });
  });

  it("has no warnings for a valid 60 + 30 minute block", () => {
    const result = evaluateBlock([
      { lengthMinutes: 60 },
      { lengthMinutes: 30 },
    ]);

    expect(result.warnings).toEqual([]);
  });

  it("warns for four sessions even when duration is exactly 90 minutes", () => {
    const result = evaluateBlock([
      { lengthMinutes: 45 },
      { lengthMinutes: 15 },
      { lengthMinutes: 15 },
      { lengthMinutes: 15 },
    ]);

    expect(result.warnings).toEqual([
      {
        code: "too_many_sessions",
        message: expect.stringContaining("3"),
      },
    ]);
  });

  it("warns when a session has unknown length", () => {
    const result = evaluateBlock([
      { lengthMinutes: 60 },
      { lengthMinutes: null },
    ]);

    expect(result.warnings).toContainEqual({
      code: "unknown_length",
      message: expect.stringMatching(/unknown/i),
    });
  });

  it("warns when a block contains a removed session", () => {
    const result = evaluateBlock([
      { lengthMinutes: 30, status: "removed" },
      { lengthMinutes: 30 },
    ]);

    expect(result.warnings).toContainEqual({
      code: "removed_session",
      message: expect.stringMatching(/catalog/i),
    });
  });

  it("warns when a block contains a session hidden from the catalog", () => {
    const result = evaluateBlock([
      { lengthMinutes: 30, hiddenFromCatalog: true },
      { lengthMinutes: 30 },
    ]);

    expect(result.warnings).toContainEqual({
      code: "removed_session",
      message: expect.stringMatching(/catalog/i),
    });
  });
});
