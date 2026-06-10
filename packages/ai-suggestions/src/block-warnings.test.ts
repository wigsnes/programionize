import { describe, expect, it } from "vitest";
import { attachBlockWarnings } from "./block-warnings.js";
import type { SuggestedGroup } from "./types.js";

describe("attachBlockWarnings", () => {
  it("adds block rule warnings to groups", () => {
    const groups: SuggestedGroup[] = [
      {
        title: "Heavy",
        rationale: "Too long",
        totalMinutes: 120,
        warnings: [],
        sessions: [
          {
            sessionizeId: "a",
            title: "A",
            lengthMinutes: 60,
            field: "Dev",
          },
          {
            sessionizeId: "b",
            title: "B",
            lengthMinutes: 60,
            field: "Dev",
          },
        ],
      },
    ];

    const result = attachBlockWarnings(groups);
    expect(result[0]?.warnings.some((w) => w.code === "duration_too_long")).toBe(
      true,
    );
  });
});
