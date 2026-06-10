import { describe, expect, it } from "vitest";
import { plainSessionDescription } from "./session-description";

describe("plainSessionDescription", () => {
  it("returns empty string for null or blank descriptions", () => {
    expect(plainSessionDescription(null)).toBe("");
    expect(plainSessionDescription("")).toBe("");
    expect(plainSessionDescription("   ")).toBe("");
  });

  it("strips HTML and normalizes whitespace", () => {
    expect(plainSessionDescription("<b>Hello</b> world")).toBe("Hello world");
    expect(plainSessionDescription("<p>Line one</p><p>Line two</p>")).toBe(
      "Line one Line two",
    );
  });

  it("returns plain text unchanged", () => {
    expect(plainSessionDescription("A plain talk abstract.")).toBe(
      "A plain talk abstract.",
    );
  });
});
