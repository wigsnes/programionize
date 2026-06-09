import { describe, expect, it } from "vitest";
import {
  isSessionizeSchedulable,
  parseSchedulableStatuses,
} from "./schedulable-status.js";

describe("parseSchedulableStatuses", () => {
  it("defaults to Accept queue and Accepted", () => {
    expect(parseSchedulableStatuses(undefined)).toEqual([
      "Accept_Queue",
      "Accepted",
    ]);
  });

  it("parses a comma-separated env override", () => {
    expect(parseSchedulableStatuses("Accepted,Nominated")).toEqual([
      "Accepted",
      "Nominated",
    ]);
  });
});

describe("isSessionizeSchedulable", () => {
  it("excludes nominated and decline queue talks", () => {
    const allowed = parseSchedulableStatuses(undefined);
    expect(isSessionizeSchedulable("Accept_Queue", allowed)).toBe(true);
    expect(isSessionizeSchedulable("Accepted", allowed)).toBe(true);
    expect(isSessionizeSchedulable("Nominated", allowed)).toBe(false);
    expect(isSessionizeSchedulable("Decline_Queue", allowed)).toBe(false);
  });
});
