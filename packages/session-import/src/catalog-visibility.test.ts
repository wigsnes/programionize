import { describe, expect, it } from "vitest";
import {
  effectiveShowInCatalog,
  isHiddenFromCatalog,
} from "./catalog-visibility.js";

const base = {
  status: "active" as const,
  isServiceSession: false,
  sessionizeStatus: "Accept_Queue",
};

describe("effectiveShowInCatalog", () => {
  it("hides removed sessions", () => {
    expect(
      effectiveShowInCatalog({ ...base, status: "removed" }),
    ).toBe(false);
  });

  it("shows schedulable sessions by default", () => {
    expect(effectiveShowInCatalog(base)).toBe(true);
  });

  it("hides nominated sessions by default", () => {
    expect(
      effectiveShowInCatalog({ ...base, sessionizeStatus: "Nominated" }),
    ).toBe(false);
  });

  it("respects explicit showInCatalog true on nominated sessions", () => {
    expect(
      effectiveShowInCatalog({
        ...base,
        sessionizeStatus: "Nominated",
        showInCatalog: true,
      }),
    ).toBe(true);
  });

  it("respects explicit showInCatalog false on accepted sessions", () => {
    expect(
      effectiveShowInCatalog({ ...base, showInCatalog: false }),
    ).toBe(false);
  });

  it("shows service sessions by default", () => {
    expect(
      effectiveShowInCatalog({ ...base, isServiceSession: true }),
    ).toBe(true);
  });
});

describe("isHiddenFromCatalog", () => {
  it("is the inverse of effectiveShowInCatalog", () => {
    expect(isHiddenFromCatalog({ ...base, showInCatalog: false })).toBe(true);
    expect(isHiddenFromCatalog(base)).toBe(false);
  });
});
