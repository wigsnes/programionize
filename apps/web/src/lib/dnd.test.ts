import { describe, expect, it } from "vitest";
import { blockSlotDropId, parseBlockDropId } from "./dnd";

describe("dnd ids", () => {
  it("round-trips block slot drop ids", () => {
    const dropId = blockSlotDropId("blocks_1", 2);
    expect(parseBlockDropId(dropId)).toEqual({
      blockId: "blocks_1",
      insertAtIndex: 2,
    });
  });

  it("parses legacy block-only drop ids", () => {
    expect(parseBlockDropId("block:blocks_1")).toEqual({
      blockId: "blocks_1",
    });
  });
});
