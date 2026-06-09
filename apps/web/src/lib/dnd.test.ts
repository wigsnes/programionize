import { describe, expect, it } from "vitest";
import { blockDropId, blockSlotDropId, parseBlockDropId } from "./dnd";

describe("dnd ids", () => {
  it("parses block-level drop ids", () => {
    expect(parseBlockDropId(blockDropId("blocks_1"))).toEqual({
      blockId: "blocks_1",
    });
  });

  it("parses slot drop ids with insert index", () => {
    expect(parseBlockDropId(blockSlotDropId("blocks_1", 2))).toEqual({
      blockId: "blocks_1",
      insertAtIndex: 2,
    });
  });
});
