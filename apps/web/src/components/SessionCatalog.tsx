import { useDroppable } from "@dnd-kit/core";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  filterByField,
  filterByLength,
  filterFitsBlock,
  filterSessions,
  partitionCatalogSessions,
  sortSessions,
  uniqueFields,
  uniqueLengths,
  type CatalogSession,
  type SelectedBlockStats,
} from "../lib/sessions";
import { CatalogFilterBar } from "./CatalogFilterBar";
import { DraggableSessionCard } from "./DraggableSessionCard";
import { SessionCard } from "./SessionCard";

type SessionCatalogProps = {
  sessions: CatalogSession[];
  droppableId?: string;
  isDragActive?: boolean;
  selectedBlock?: SelectedBlockStats | null;
  selectedBlockLabel?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileSheet?: boolean;
};

export function SessionCatalog({
  sessions,
  droppableId,
  isDragActive = false,
  selectedBlock = null,
  selectedBlockLabel = null,
  collapsed = false,
  onToggleCollapse,
  mobileSheet = false,
}: SessionCatalogProps) {
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<number | null>(null);
  const [fitsBlockOnly, setFitsBlockOnly] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId ?? "catalog-disabled",
    disabled: !droppableId,
  });

  const { schedulable, service, otherImported } = useMemo(
    () => partitionCatalogSessions(sessions),
    [sessions],
  );

  const fields = useMemo(() => uniqueFields(schedulable), [schedulable]);
  const lengths = useMemo(() => uniqueLengths(schedulable), [schedulable]);

  const visibleSchedulable = useMemo(() => {
    let result = schedulable;
    result = filterByField(result, selectedField);
    result = filterByLength(result, selectedLength);
    result = filterSessions(result, query);
    if (fitsBlockOnly) {
      result = filterFitsBlock(result, selectedBlock);
    }
    return sortSessions(result);
  }, [
    schedulable,
    selectedField,
    selectedLength,
    query,
    fitsBlockOnly,
    selectedBlock,
  ]);

  const visibleService = useMemo(
    () => sortSessions(filterSessions(service, query)),
    [service, query],
  );

  if (collapsed && !mobileSheet) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-r border-border/50 bg-muted/20 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label="Show session catalog"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <section
      ref={droppableId ? setNodeRef : undefined}
      className={cn(
        "flex min-h-0 w-full shrink-0 flex-col border-r border-border bg-background transition-colors",
        mobileSheet ? "h-full max-w-none" : "max-w-md",
        isOver && "bg-primary/5",
      )}
      aria-label="Session catalog"
    >
      <div className="shrink-0 space-y-2 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Sessions</h2>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="tabular-nums">
              {visibleSchedulable.length}
            </Badge>
            {onToggleCollapse && !mobileSheet ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onToggleCollapse}
                aria-label="Hide session catalog"
              >
                <PanelLeftClose className="size-3.5" />
              </Button>
            ) : null}
          </div>
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
            data-catalog-search
          />
        </div>
        <CatalogFilterBar
          fields={fields}
          selectedField={selectedField}
          onFieldChange={setSelectedField}
          lengths={lengths}
          selectedLength={selectedLength}
          onLengthChange={setSelectedLength}
          fitsBlockOnly={fitsBlockOnly}
          onFitsBlockChange={setFitsBlockOnly}
          selectedBlock={selectedBlock}
          selectedBlockLabel={selectedBlockLabel}
        />
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
            "mx-3 mt-2 shrink-0 rounded-md border border-dashed border-border bg-muted px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors",
            isOver && "border-primary bg-accent font-medium text-primary",
          )}
        >
          Drop here to return to catalog
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
      </div>
    </section>
  );
}
