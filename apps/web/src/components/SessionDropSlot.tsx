import { useDroppable } from "@dnd-kit/core";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { blockSlotDropId } from "../lib/dnd";

type SessionDropSlotProps = {
  blockId: Id<"blocks">;
  index: number;
  isDragActive: boolean;
  isEmptyBlock?: boolean;
  overlay?: boolean;
  className?: string;
};

export function SessionDropSlot({
  blockId,
  index,
  isDragActive,
  isEmptyBlock = false,
  overlay = false,
  className,
}: SessionDropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: blockSlotDropId(String(blockId), index),
  });

  if (overlay) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "absolute left-0 right-0 z-10 rounded-md transition-colors duration-150",
          isDragActive ? "pointer-events-auto h-5" : "pointer-events-none h-0",
          isDragActive &&
            isOver &&
            "bg-accent shadow-[inset_0_0_0_2px_var(--color-primary)]",
          isDragActive &&
            !isOver &&
            "before:absolute before:top-1/2 before:right-3 before:left-3 before:h-0.5 before:-translate-y-1/2 before:rounded-full before:bg-border before:content-['']",
          isDragActive &&
            isOver &&
            "before:absolute before:top-1/2 before:right-3 before:left-3 before:h-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-md transition-all duration-150",
        isEmptyBlock
          ? isDragActive
            ? "min-h-12"
            : "min-h-0"
          : isDragActive
            ? "min-h-5"
            : "min-h-0",
        isDragActive &&
          isOver &&
          "min-h-11 bg-accent shadow-[inset_0_0_0_2px_var(--color-primary)]",
        isDragActive &&
          !isOver &&
          "before:absolute before:top-1/2 before:right-3 before:left-3 before:h-0.5 before:-translate-y-1/2 before:rounded-full before:bg-border before:content-['']",
        isDragActive &&
          isOver &&
          "before:absolute before:top-1/2 before:right-3 before:left-3 before:h-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']",
        className,
      )}
      aria-hidden
    />
  );
}
