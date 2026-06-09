import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin, rectIntersection } from "@dnd-kit/core";

export const CATALOG_DROP_ID = "catalog";

export type BlockDropTarget = {
  blockId: string;
  insertAtIndex?: number;
};

export function blockDropId(blockId: string): string {
  return `block:${blockId}`;
}

export function blockSlotDropId(blockId: string, index: number): string {
  return `block:${blockId}:slot:${index}`;
}

function isSlotDropId(id: string | number): boolean {
  return String(id).includes(":slot:");
}

export const programCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const slotHits = pointerCollisions.filter((c) => isSlotDropId(c.id));
  if (slotHits.length > 0) return slotHits;

  const blockHits = pointerCollisions.filter(
    (c) => String(c.id).startsWith("block:") && !isSlotDropId(c.id),
  );
  if (blockHits.length > 0) return blockHits;

  if (pointerCollisions.length > 0) return pointerCollisions;

  return rectIntersection(args);
};

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
