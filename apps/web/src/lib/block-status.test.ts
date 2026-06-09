import { describe, expect, it } from "vitest";
import { getBlockStatus } from "./block-status";

describe("getBlockStatus", () => {
  it("returns empty for blocks with no sessions", () => {
    expect(getBlockStatus([], 0)).toBe("empty");
  });

  it("returns good for a valid 90-minute block", () => {
    expect(
      getBlockStatus(
        [
          { lengthMinutes: 60, status: "active" },
          { lengthMinutes: 30, status: "active" },
        ],
        90,
      ),
    ).toBe("good");
  });

  it("returns warning when block rules fail", () => {
    expect(
      getBlockStatus(
        [
          { lengthMinutes: 45, status: "active" },
          { lengthMinutes: 15, status: "active" },
          { lengthMinutes: 15, status: "active" },
          { lengthMinutes: 15, status: "active" },
        ],
        90,
      ),
    ).toBe("warning");
  });

  it("returns building for blocks still under 80 minutes", () => {
    expect(
      getBlockStatus(
        [{ lengthMinutes: 45, status: "active" }],
        45,
      ),
    ).toBe("building");
  });

  it("returns good for exactly three sessions within range", () => {
    expect(
      getBlockStatus(
        [
          { lengthMinutes: 30, status: "active" },
          { lengthMinutes: 30, status: "active" },
          { lengthMinutes: 30, status: "active" },
        ],
        90,
      ),
    ).toBe("good");
  });
});
