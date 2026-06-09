import { useDroppable } from "@dnd-kit/core";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { blockSlotDropId } from "../lib/dnd";

type SessionDropSlotProps = {
  blockId: Id<"blocks">;
  index: number;
  isDragActive: boolean;
  isEmptyBlock?: boolean;
};

export function SessionDropSlot({
  blockId,
  index,
  isDragActive,
  isEmptyBlock = false,
}: SessionDropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: blockSlotDropId(blockId, index),
  });

  if (!isDragActive) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-all duration-150",
        isEmptyBlock ? "min-h-12" : "min-h-2",
        isOver && "relative min-h-11 bg-primary/10 shadow-[inset_0_0_0_2px_var(--color-primary)]",
        isOver &&
          "before:absolute before:top-1/2 before:right-3 before:left-3 before:h-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']",
      )}
      aria-hidden
    />
  );
}
