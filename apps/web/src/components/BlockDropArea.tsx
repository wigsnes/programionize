import { useDroppable } from "@dnd-kit/core";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { blockDropId } from "../lib/dnd";

type BlockDropAreaProps = {
  blockId: Id<"blocks">;
  isDragActive: boolean;
  className?: string;
  children: React.ReactNode;
};

export function BlockDropArea({
  blockId,
  isDragActive,
  className,
  children,
}: BlockDropAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: blockDropId(String(blockId)),
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative",
        className,
        isDragActive &&
          isOver &&
          "bg-accent ring-1 ring-inset ring-ring",
      )}
    >
      {children}
    </div>
  );
}
