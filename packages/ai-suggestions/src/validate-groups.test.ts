import { describe, expect, it } from "vitest";
import { enrichSuggestedGroups } from "./enrich-groups.js";
import { dedupeRawGroups, buildSuggestionRunReport } from "./validate-groups.js";
import type { SuggestionInputSession } from "./types.js";

const input: SuggestionInputSession[] = [
  {
    sessionizeId: "a",
    title: "A",
    description: null,
    lengthMinutes: 30,
    field: "Dev",
    speakerNames: [],
  },
  {
    sessionizeId: "b",
    title: "B",
    description: null,
    lengthMinutes: 45,
    field: "Ops",
    speakerNames: [],
  },
  {
    sessionizeId: "c",
    title: "C",
    description: null,
    lengthMinutes: 15,
    field: "Dev",
    speakerNames: [],
  },
];

describe("dedupeRawGroups", () => {
  it("removes duplicate ids from later groups", () => {
    const { groups, duplicates } = dedupeRawGroups(
      [
        { title: "G1", rationale: "r", sessionizeIds: ["a", "b"] },
        { title: "G2", rationale: "r", sessionizeIds: ["b", "c"] },
      ],
      input,
    );

    expect(groups[0]?.sessionizeIds).toEqual(["a", "b"]);
    expect(groups[1]?.sessionizeIds).toEqual(["c"]);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.sessionizeId).toBe("b");
  });

  it("tracks invalid hallucinated ids", () => {
    const { invalidIds } = dedupeRawGroups(
      [{ title: "G1", rationale: "r", sessionizeIds: ["a", "ghost"] }],
      input,
    );
    expect(invalidIds).toEqual(["ghost"]);
  });
});

describe("buildSuggestionRunReport", () => {
  it("lists uncovered sessions", () => {
    const groups = enrichSuggestedGroups(
      [{ title: "G1", rationale: "r", sessionizeIds: ["a"] }],
      input,
    );
    const report = buildSuggestionRunReport(groups, input, {
      duplicates: [],
      invalidIds: [],
    });
    expect(report.inputSessionCount).toBe(3);
    expect(report.groupedSessionCount).toBe(1);
    expect(report.uncoveredSessions).toEqual([
      { sessionizeId: "b", title: "B" },
      { sessionizeId: "c", title: "C" },
    ]);
  });
});
