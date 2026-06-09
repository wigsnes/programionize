import { describe, expect, it } from "vitest";
import { computeProgramHealth } from "./program-health";

const session = (overrides: Record<string, unknown> = {}) => ({
  _id: "s1",
  title: "Talk",
  description: null,
  field: "Dev",
  lengthMinutes: 30,
  speakerNames: [],
  isServiceSession: false,
  sessionizeStatus: "Accept_Queue",
  status: "active" as const,
  ...overrides,
});

describe("computeProgramHealth", () => {
  it("returns perfect health when there are no blocks", () => {
    expect(computeProgramHealth([])).toEqual({
      score: 100,
      issueCount: 0,
      issues: [],
    });
  });

  it("scores blocks without warnings as healthy", () => {
    const health = computeProgramHealth([
      {
        _id: "b1",
        label: "Morning",
        sessions: [
          session({ lengthMinutes: 60 }),
          session({ _id: "s2", lengthMinutes: 30 }),
        ],
      },
    ]);

    expect(health.score).toBe(100);
    expect(health.issueCount).toBe(0);
  });

  it("collects issues from blocks with warnings", () => {
    const health = computeProgramHealth([
      {
        _id: "b1",
        label: "Overfull",
        sessions: [
          session({ lengthMinutes: 45 }),
          session({ _id: "s2", lengthMinutes: 15 }),
          session({ _id: "s3", lengthMinutes: 15 }),
          session({ _id: "s4", lengthMinutes: 15 }),
        ],
      },
      {
        _id: "b2",
        label: "Good",
        sessions: [
          session({ lengthMinutes: 60 }),
          session({ _id: "s5", lengthMinutes: 30 }),
        ],
      },
    ]);

    expect(health.score).toBe(50);
    expect(health.issueCount).toBe(1);
    expect(health.issues).toHaveLength(1);
    expect(health.issues[0]?.blockLabel).toBe("Overfull");
  });
});
