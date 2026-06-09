import { describe, expect, it } from "vitest";
import { computeBlockTotals, unassignedSessions } from "./block-totals.js";

describe("computeBlockTotals", () => {
  it("sums minutes and counts sessions", () => {
    const totals = computeBlockTotals([
      { lengthMinutes: 30 },
      { lengthMinutes: 45 },
      { lengthMinutes: null },
    ]);
    expect(totals).toEqual({ sessionCount: 3, totalMinutes: 75 });
  });
});

describe("unassignedSessions", () => {
  it("excludes sessions already placed on the page", () => {
    const all = [
      { _id: "a", title: "A" },
      { _id: "b", title: "B" },
      { _id: "c", title: "C" },
    ];
    expect(unassignedSessions(all, new Set(["b"]))).toEqual([
      { _id: "a", title: "A" },
      { _id: "c", title: "C" },
    ]);
  });
});
