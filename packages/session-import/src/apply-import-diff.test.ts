import { describe, expect, it } from "vitest";
import { applyImportDiff } from "./apply-import-diff.js";
import type { ImportedSession } from "./types.js";

const incoming: ImportedSession[] = [
  {
    sessionizeId: "a",
    title: "Talk A",
    description: null,
    field: "Dev",
    lengthMinutes: 30,
    isServiceSession: false,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    status: "active",
  },
  {
    sessionizeId: "b",
    title: "Talk B",
    description: null,
    field: "Ops",
    lengthMinutes: 45,
    isServiceSession: false,
    speakerNames: [],
    sessionizeStatus: "Accepted",
    status: "active",
  },
];

describe("applyImportDiff", () => {
  it("upserts all sessions on first import", () => {
    const result = applyImportDiff([], incoming);
    expect(result.upserts).toHaveLength(2);
    expect(result.markRemovedIds).toEqual([]);
  });

  it("marks sessions missing from Sessionize as removed on re-import", () => {
    const existing = [
      { sessionizeId: "a", status: "active" as const },
      { sessionizeId: "c", status: "active" as const },
    ];
    const result = applyImportDiff(existing, incoming);
    expect(result.upserts.map((s) => s.sessionizeId).sort()).toEqual(["a", "b"]);
    expect(result.markRemovedIds).toEqual(["c"]);
  });

  it("upserts newly added sessions on re-import", () => {
    const existing = [{ sessionizeId: "a", status: "active" as const }];
    const result = applyImportDiff(existing, incoming);
    expect(result.upserts.map((s) => s.sessionizeId).sort()).toEqual(["a", "b"]);
    expect(result.markRemovedIds).toEqual([]);
  });
});
