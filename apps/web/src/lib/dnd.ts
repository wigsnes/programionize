export const CATALOG_DROP_ID = "catalog";

export type BlockDropTarget = {
  blockId: string;
  insertAtIndex?: number;
};

export function blockSlotDropId(blockId: string, index: number): string {
  return `block:${blockId}:slot:${index}`;
}

export function parseBlockDropId(dropId: string): BlockDropTarget | null {
  const slotMatch = dropId.match(/^block:([^:]+):slot:(\d+)$/);
  if (slotMatch) {
    return {
      blockId: slotMatch[1],
      insertAtIndex: Number.parseInt(slotMatch[2], 10),
    };
  }
  if (dropId.startsWith("block:")) {
    return { blockId: dropId.slice("block:".length) };
  }
  return null;
}
