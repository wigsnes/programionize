import { describe, expect, it } from "vitest";
import {
  enrichSuggestedGroups,
  formatGroupForClipboard,
} from "./enrich-groups.js";
import type { SuggestionInputSession } from "./types.js";

const sessions: SuggestionInputSession[] = [
  {
    sessionizeId: "a",
    title: "Talk A",
    description: "kubernetes",
    lengthMinutes: 30,
    field: "Dev",
    speakerNames: ["Alice"],
  },
  {
    sessionizeId: "b",
    title: "Talk B",
    description: null,
    lengthMinutes: 45,
    field: "Ops",
    speakerNames: [],
  },
];

describe("enrichSuggestedGroups", () => {
  it("resolves session details and totals minutes", () => {
    const groups = enrichSuggestedGroups(
      [
        {
          title: "Platform",
          rationale: "Infra themed",
          sessionizeIds: ["a", "b"],
        },
      ],
      sessions,
    );

    expect(groups).toEqual([
      {
        title: "Platform",
        rationale: "Infra themed",
        sessions: [
          {
            sessionizeId: "a",
            title: "Talk A",
            lengthMinutes: 30,
            field: "Dev",
          },
          {
            sessionizeId: "b",
            title: "Talk B",
            lengthMinutes: 45,
            field: "Ops",
          },
        ],
        totalMinutes: 75,
        warnings: [],
      },
    ]);
  });

  it("drops unknown session ids and empty groups", () => {
    const groups = enrichSuggestedGroups(
      [
        {
          title: "Empty",
          rationale: "n/a",
          sessionizeIds: ["missing"],
        },
        {
          title: "One talk",
          rationale: "solo",
          sessionizeIds: ["a"],
        },
      ],
      sessions,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.sessions).toHaveLength(1);
  });
});

describe("formatGroupForClipboard", () => {
  it("formats a group for manual paste", () => {
    const text = formatGroupForClipboard({
      title: "Platform",
      rationale: "Infra themed",
      sessions: [
        {
          sessionizeId: "a",
          title: "Talk A",
          lengthMinutes: 30,
          field: "Dev",
        },
        {
          sessionizeId: "b",
          title: "Talk B",
          lengthMinutes: 45,
          field: "Ops",
        },
      ],
      totalMinutes: 75,
      warnings: [],
    });

    expect(text).toContain("Platform");
    expect(text).toContain("Talk A (30 min)");
    expect(text).toContain("Total: 75 min");
  });
});
