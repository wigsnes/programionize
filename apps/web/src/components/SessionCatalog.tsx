import { useDroppable } from "@dnd-kit/core";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  filterSessions,
  partitionCatalogSessions,
  sortSessions,
  type CatalogSession,
} from "../lib/sessions";
import { DraggableSessionCard } from "./DraggableSessionCard";
import { SessionCard } from "./SessionCard";

type SessionCatalogProps = {
  sessions: CatalogSession[];
  droppableId?: string;
  isDragActive?: boolean;
};

export function SessionCatalog({
  sessions,
  droppableId,
  isDragActive = false,
}: SessionCatalogProps) {
  const [query, setQuery] = useState("");
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId ?? "catalog-disabled",
    disabled: !droppableId,
  });

  const { schedulable, service, otherImported } = useMemo(
    () => partitionCatalogSessions(sessions),
    [sessions],
  );

  const visibleSchedulable = useMemo(
    () => sortSessions(filterSessions(schedulable, query)),
    [schedulable, query],
  );

  const visibleService = useMemo(
    () => sortSessions(filterSessions(service, query)),
    [service, query],
  );

  return (
    <section
      ref={droppableId ? setNodeRef : undefined}
      className={cn(
        "flex min-h-0 w-full max-w-md shrink-0 flex-col border-r border-border/50 bg-muted/30 transition-colors",
        isOver && "bg-primary/5",
      )}
      aria-label="Session catalog"
    >
      <div className="shrink-0 space-y-2 border-b border-border/50 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Sessions</h2>
          <Badge variant="secondary" className="tabular-nums">
            {visibleSchedulable.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search talks…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search sessions"
            className="h-8 pl-8"
          />
        </div>
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
          {visibleSchedulable.length} in Accept queue / Accepted
          {otherImported.length > 0
            ? ` · ${otherImported.length} hidden`
            : ""}
          {visibleService.length > 0
            ? ` · ${visibleService.length} service`
            : ""}
        </p>
      </div>
      {isDragActive && droppableId ? (
        <div
          className={cn(
            "mx-3 mt-2 shrink-0 rounded-md border border-dashed border-primary/30 bg-background/50 px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors",
            isOver && "border-primary bg-primary/10 font-medium text-primary",
          )}
        >
          Drop here to return to catalog
        </div>
      ) : null}
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-1.5 p-3 pr-4">
          {visibleSchedulable.map((session) => (
            <li key={session._id}>
              <DraggableSessionCard session={session} variant="compact" />
            </li>
          ))}
        </ul>
        {visibleService.length > 0 ? (
          <div className="px-3 pb-3">
            <Separator className="mb-2" />
            <h3 className="text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
              Service sessions
            </h3>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
              Reference only — not schedulable.
            </p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {visibleService.map((session) => (
                <li key={session._id}>
                  <SessionCard session={session} variant="compact" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </ScrollArea>
    </section>
  );
}
