import { describe, expect, it } from "vitest";
import { buildApplyPreview } from "./apply-preview.js";
import type { SuggestedGroup } from "./types.js";

const group: SuggestedGroup = {
  title: "Platform",
  rationale: "Infra",
  totalMinutes: 75,
  warnings: [],
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
      field: "Dev",
    },
  ],
};

describe("buildApplyPreview", () => {
  it("detects sessions that will move from existing blocks", () => {
    const preview = buildApplyPreview(group, [
      {
        _id: "block1",
        label: "Morning",
        sessions: [{ sessionizeId: "b", title: "Talk B" }],
      },
    ]);

    expect(preview.moveCount).toBe(1);
    expect(preview.toAssign[1]?.fromBlockLabel).toBe("Morning");
    expect(preview.toAssign[0]?.fromBlockLabel).toBeNull();
  });
});
