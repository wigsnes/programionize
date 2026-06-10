import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getBlockStatus,
  getBlockWarnings,
  getHardWarnings,
} from "@/lib/block-status";
import { isHiddenFromCatalog, type CatalogSession } from "../lib/sessions";
import { BlockDropArea } from "./BlockDropArea";
import { BlockHealthBar } from "./BlockHealthBar";
import { BlockStatusPill } from "./BlockStatusPill";
import { DraggableSessionCard } from "./DraggableSessionCard";
import { SessionDropSlot } from "./SessionDropSlot";

export type BlockView = {
  _id: Id<"blocks">;
  label: string | null;
  sessionCount: number;
  totalMinutes: number;
  sessions: CatalogSession[];
};

type BlockPanelProps = {
  block: BlockView;
  activeDragId: string | null;
  isSelected?: boolean;
  isDropCompatible?: boolean;
  onSelect?: (blockId: Id<"blocks">) => void;
  onRename: (blockId: Id<"blocks">) => void;
  onRemove: (blockId: Id<"blocks">) => void;
  onAiComplete?: (blockId: Id<"blocks">) => void;
  onAiReview?: (blockId: Id<"blocks">) => void;
};

export function BlockPanel({
  block,
  activeDragId,
  isSelected = false,
  isDropCompatible = false,
  onSelect,
  onRename,
  onRemove,
  onAiComplete,
  onAiReview,
}: BlockPanelProps) {
  const sessionInputs = block.sessions.map((session) => ({
    lengthMinutes: session.lengthMinutes,
    status: session.status,
    hiddenFromCatalog: isHiddenFromCatalog(session),
  }));

  const warnings = getBlockWarnings(sessionInputs);
  const hardWarnings = getHardWarnings(warnings);
  const status = getBlockStatus(sessionInputs, block.totalMinutes);

  const isDragActive = activeDragId !== null;
  const isEmpty = block.sessionCount === 0;

  if (isEmpty) {
    return (
      <BlockDropArea
        blockId={block._id}
        isDragActive={isDragActive}
        className={cn(
          "rounded-xl border border-dashed border-border bg-card px-4 py-4 transition-all",
          isDragActive && "border-primary",
          isSelected && "ring-2 ring-ring",
          isDropCompatible && "border-primary bg-accent",
        )}
      >
        <div
          onClick={() => onSelect?.(block._id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect?.(block._id);
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground/80">
                {block.label ?? "Empty block"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag sessions here
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Block actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onRename(block._id)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onRemove(block._id)}
                >
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <SessionDropSlot
            blockId={block._id}
            index={0}
            isDragActive={isDragActive}
            isEmptyBlock
          />
        </div>
      </BlockDropArea>
    );
  }

  return (
    <BlockDropArea
      blockId={block._id}
      isDragActive={isDragActive}
      className={cn(
        "shrink-0 rounded-xl transition-all",
        isDropCompatible && isDragActive && "ring-1 ring-primary",
      )}
    >
      <Card
        className={cn(
          "gap-0 rounded-xl border py-0 shadow-sm transition-all",
          isSelected && "ring-2 ring-ring",
          isDropCompatible && "border-primary",
        )}
        onClick={() => onSelect?.(block._id)}
      >
        <CardHeader className="gap-2.5 border-b border-border/50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {block.label ?? "Block"}
              </h3>
              <BlockStatusPill status={status} />
              {hardWarnings.length > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-5 gap-1 px-1.5 text-amber-700 hover:bg-warning/10 hover:text-amber-700 dark:text-warning"
                      aria-label={`${hardWarnings.length} block warning${hardWarnings.length === 1 ? "" : "s"}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <AlertTriangle className="size-3" />
                      {hardWarnings.length}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-64"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ul
                      className="space-y-1.5 text-xs text-foreground/80"
                      aria-label="Block warnings"
                    >
                      {warnings.map((warning) => (
                        <li key={warning.code} className="flex items-start gap-1.5">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-600" />
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <BlockHealthBar totalMinutes={block.totalMinutes} className="flex-1" />
              <span className="shrink-0 text-xs font-medium text-foreground/70 tabular-nums">
                {block.totalMinutes}
                <span className="text-muted-foreground">/90 min</span>
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Block actions"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onAiComplete ? (
                <DropdownMenuItem onClick={() => onAiComplete(block._id)}>
                  AI: Complete block
                </DropdownMenuItem>
              ) : null}
              {onAiReview ? (
                <DropdownMenuItem onClick={() => onAiReview(block._id)}>
                  AI: Review block
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onRename(block._id)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onRemove(block._id)}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </CardHeader>
        <CardContent className="px-3 py-3">
          <ul className="flex flex-col gap-1.5">
            {block.sessions.map((session, index) => (
              <li key={session._id} className="relative">
                <SessionDropSlot
                  blockId={block._id}
                  index={index}
                  isDragActive={isDragActive}
                  overlay
                  className="top-0 -translate-y-1/2"
                />
                <DraggableSessionCard session={session} variant="timeline" />
              </li>
            ))}
            <li className="relative h-0">
              <SessionDropSlot
                blockId={block._id}
                index={block.sessions.length}
                isDragActive={isDragActive}
                overlay
                className="top-0 h-5"
              />
            </li>
          </ul>
        </CardContent>
      </Card>
    </BlockDropArea>
  );
}
