import { describe, expect, it } from "vitest";
import {
  buildSuggestionPrompt,
  buildSuggestionPrompts,
  compactSessionDescription,
  stripHtml,
} from "./prompt.js";
import type { SuggestionInputSession } from "./types.js";

const session = (
  overrides: Partial<SuggestionInputSession> = {},
): SuggestionInputSession => ({
  sessionizeId: "s1",
  title: "Talk",
  description: null,
  lengthMinutes: 30,
  field: "Dev",
  speakerNames: ["Jane Doe"],
  ...overrides,
});

describe("compactSessionDescription", () => {
  it("strips HTML and truncates long descriptions", () => {
    const long = `<p>${"word ".repeat(200)}</p>`;
    const compact = compactSessionDescription(long, 50);
    expect(compact).not.toMatch(/<p>/);
    expect(compact.length).toBeLessThanOrEqual(50);
    expect(compact.endsWith("…")).toBe(true);
  });
});

describe("buildSuggestionPrompt", () => {
  it("includes truncated description text", () => {
    const prompt = buildSuggestionPrompt([
      session({ description: "<b>Hello</b> world" }),
    ]);
    expect(prompt).toContain("Hello world");
    expect(prompt).not.toContain("<b>");
  });

  it("includes field and speaker names", () => {
    const prompt = buildSuggestionPrompt([session()]);
    expect(prompt).toContain("[Dev]");
    expect(prompt).toContain("speakers: Jane Doe");
  });
});

describe("buildSuggestionPrompts", () => {
  it("splits large catalogs into multiple prompts", () => {
    const sessions = Array.from({ length: 85 }, (_, i) =>
      session({ sessionizeId: `s${i}` }),
    );
    const prompts = buildSuggestionPrompts(sessions, 80);
    expect(prompts).toHaveLength(2);
    expect(prompts[0]).toContain("s0");
    expect(prompts[1]).toContain("s84");
  });
});

describe("stripHtml", () => {
  it("decodes common entities", () => {
    expect(stripHtml("a &amp; b")).toBe("a & b");
  });
});
