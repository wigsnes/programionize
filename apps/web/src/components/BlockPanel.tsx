import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { evaluateBlock } from "@programionize/block-rules";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isHiddenFromCatalog, type CatalogSession } from "../lib/sessions";
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
  onRename: (blockId: Id<"blocks">) => void;
  onRemove: (blockId: Id<"blocks">) => void;
};

export function BlockPanel({
  block,
  activeDragId,
  onRename,
  onRemove,
}: BlockPanelProps) {
  const { warnings } = evaluateBlock(
    block.sessions.map((session) => ({
      lengthMinutes: session.lengthMinutes,
      status: session.status,
      hiddenFromCatalog: isHiddenFromCatalog(session),
    })),
  );

  const isDragActive = activeDragId !== null;
  const isEmpty = block.sessionCount === 0;
  const hasWarnings = warnings.length > 0;

  if (isEmpty) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3",
          isDragActive && "border-primary/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {block.label ?? "Empty block"}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Drag sessions here
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Block actions">
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
    );
  }

  return (
    <Card
      className={cn(
        "shrink-0 gap-0 py-0 shadow-sm",
        hasWarnings && "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <CardHeader className="gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                {block.label ?? "Block"}
              </CardTitle>
              {hasWarnings ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/50 text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="size-3" />
                  {warnings.length} warning{warnings.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
            <CardDescription className="text-xs">
              {block.sessionCount} sessions · {block.totalMinutes} min
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Block actions">
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
        {hasWarnings ? (
          <ul
            className="space-y-0.5 text-xs text-amber-800 dark:text-amber-300"
            aria-label="Block warnings"
          >
            {warnings.map((warning) => (
              <li key={warning.code} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                {warning.message}
              </li>
            ))}
          </ul>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ul className={cn("flex flex-col", isDragActive ? "gap-1" : "gap-1.5")}>
          <li>
            <SessionDropSlot
              blockId={block._id}
              index={0}
              isDragActive={isDragActive}
            />
          </li>
          {block.sessions.flatMap((session, index) => [
            <li key={session._id}>
              <DraggableSessionCard session={session} variant="timeline" />
            </li>,
            <li key={`${block._id}-slot-${index + 1}`}>
              <SessionDropSlot
                blockId={block._id}
                index={index + 1}
                isDragActive={isDragActive}
              />
            </li>,
          ])}
        </ul>
      </CardContent>
    </Card>
  );
}
