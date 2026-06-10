import { describe, expect, it } from "vitest";
import {
  effectiveShowInCatalog,
  filterByLanguage,
  filterSessions,
  isHiddenFromCatalog,
  isSchedulableSession,
  partitionCatalogSessions,
  sortSessions,
} from "./sessions.js";
import type { CatalogSession } from "./sessions.js";

const sample: CatalogSession[] = [
  {
    _id: "1",
    title: "Beta",
    description: null,
    field: "Dev",
    language: "Norwegian",
    lengthMinutes: 45,
    speakerNames: [],
    isServiceSession: false,
    sessionizeStatus: "Accept_Queue",
    status: "active",
  },
  {
    _id: "2",
    title: "Alpha",
    description: "kubernetes deep dive",
    field: "Ops",
    language: "English",
    lengthMinutes: 15,
    speakerNames: ["Jane"],
    isServiceSession: false,
    sessionizeStatus: "Accepted",
    status: "active",
  },
];

describe("isSchedulableSession", () => {
  it("treats service sessions as non-schedulable", () => {
    expect(isSchedulableSession({ ...sample[0]!, isServiceSession: true })).toBe(
      false,
    );
    expect(isSchedulableSession(sample[0]!)).toBe(true);
  });
});

describe("partitionCatalogSessions", () => {
  it("separates schedulable talks from service sessions", () => {
    const service = { ...sample[0]!, _id: "svc", isServiceSession: true };
    const result = partitionCatalogSessions([...sample, service]);
    expect(result.schedulable).toHaveLength(2);
    expect(result.service).toEqual([service]);
  });

  it("hides nominated talks from the schedulable catalog", () => {
    const nominated = {
      ...sample[0]!,
      _id: "nom",
      sessionizeStatus: "Nominated",
    };
    const result = partitionCatalogSessions([nominated]);
    expect(result.schedulable).toHaveLength(0);
    expect(result.otherImported).toEqual([nominated]);
  });

  it("shows admin-promoted nominated talks in the schedulable catalog", () => {
    const nominated = {
      ...sample[0]!,
      _id: "nom",
      sessionizeStatus: "Nominated",
      showInCatalog: true,
    };
    const result = partitionCatalogSessions([nominated]);
    expect(result.schedulable).toEqual([nominated]);
    expect(result.otherImported).toHaveLength(0);
  });

  it("hides admin-hidden accepted talks from the catalog", () => {
    const hidden = { ...sample[0]!, showInCatalog: false };
    const result = partitionCatalogSessions([hidden]);
    expect(result.schedulable).toHaveLength(0);
    expect(result.otherImported).toEqual([hidden]);
  });
});

describe("catalog visibility helpers", () => {
  it("marks admin-hidden sessions as hidden from catalog", () => {
    const session = { ...sample[0]!, showInCatalog: false };
    expect(effectiveShowInCatalog(session)).toBe(false);
    expect(isHiddenFromCatalog(session)).toBe(true);
  });
});

describe("sortSessions", () => {
  it("sorts by length then title", () => {
    const sorted = sortSessions(sample);
    expect(sorted.map((s) => s.title)).toEqual(["Alpha", "Beta"]);
  });
});

describe("filterByLanguage", () => {
  it("filters sessions by language", () => {
    expect(filterByLanguage(sample, "Norwegian").map((s) => s.title)).toEqual([
      "Beta",
    ]);
    expect(filterByLanguage(sample, "English").map((s) => s.title)).toEqual([
      "Alpha",
    ]);
  });
});

describe("filterSessions", () => {
  it("finds sessions by title, description, speaker, or language", () => {
    expect(filterSessions(sample, "kubernetes").map((s) => s.title)).toEqual([
      "Alpha",
    ]);
    expect(filterSessions(sample, "jane").map((s) => s.title)).toEqual([
      "Alpha",
    ]);
    expect(filterSessions(sample, "beta").map((s) => s.title)).toEqual([
      "Beta",
    ]);
    expect(filterSessions(sample, "norwegian").map((s) => s.title)).toEqual([
      "Beta",
    ]);
  });
});
