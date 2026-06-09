import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { isSchedulableSession, type CatalogSession } from "../lib/sessions";
import { SessionCard, type SessionCardProps } from "./SessionCard";

type DraggableSessionCardProps = {
  session: CatalogSession;
  variant?: SessionCardProps["variant"];
};

export function DraggableSessionCard({
  session,
  variant = "compact",
}: DraggableSessionCardProps) {
  if (!isSchedulableSession(session)) {
    return <SessionCard session={session} variant={variant} />;
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(session._id),
    });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: isDragging ? "none" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "pointer-events-none" : undefined}
      {...listeners}
      {...attributes}
    >
      <SessionCard session={session} variant={variant} />
    </div>
  );
}
