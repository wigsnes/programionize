import { describe, expect, it } from "vitest";
import { parseLengthMinutes } from "./parse-length.js";

describe("parseLengthMinutes", () => {
  it("parses minute values from Sessionize length labels", () => {
    expect(parseLengthMinutes("15 min")).toBe(15);
    expect(parseLengthMinutes("30 minutes")).toBe(30);
    expect(parseLengthMinutes("45")).toBe(45);
    expect(parseLengthMinutes("60 min")).toBe(60);
  });

  it("returns null when length cannot be parsed", () => {
    expect(parseLengthMinutes("")).toBeNull();
    expect(parseLengthMinutes("unknown")).toBeNull();
  });
});
