import { describe, expect, it } from "vitest";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import type { BlockView } from "../components/BlockPanel";
import { sessionFitsBlock } from "./drag-preview";

const blockId = "blocks_1" as Id<"blocks">;

function makeBlock(overrides: Partial<BlockView> = {}): BlockView {
  return {
    _id: blockId,
    label: "Block 1",
    sessionCount: 3,
    totalMinutes: 90,
    sessions: [
      session({ _id: "1", lengthMinutes: 30 }),
      session({ _id: "2", lengthMinutes: 30 }),
      session({ _id: "3", lengthMinutes: 30 }),
    ],
    ...overrides,
  };
}

function session(
  overrides: Partial<BlockView["sessions"][number]> = {},
): BlockView["sessions"][number] {
  return {
    _id: "1",
    title: "Talk",
    description: null,
    field: "Dev",
    lengthMinutes: 30,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    isServiceSession: false,
    status: "active",
    ...overrides,
  };
}

describe("sessionFitsBlock", () => {
  it("allows reordering within a full block", () => {
    const block = makeBlock();
    expect(sessionFitsBlock(session({ _id: "2" }), block)).toBe(true);
  });

  it("reports no fit when adding a fourth session", () => {
    const block = makeBlock();
    expect(sessionFitsBlock(session({ _id: "4", lengthMinutes: 15 }), block)).toBe(
      false,
    );
  });
});
