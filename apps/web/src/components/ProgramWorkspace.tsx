import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { Layers, Plus } from "lucide-react";
import { CATALOG_DROP_ID, parseBlockDropId } from "../lib/dnd";
import type { CatalogSession } from "../lib/sessions";
import { useConfirm, usePrompt } from "./dialogs/DialogProvider";
import { BlockPanel } from "./BlockPanel";
import { SessionCard } from "./SessionCard";
import { SessionCatalog } from "./SessionCatalog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

type ProgramWorkspaceProps = {
  sessionToken: string;
  programPageId: Id<"programPages">;
  catalogSessions: CatalogSession[];
};

export function ProgramWorkspace({
  sessionToken,
  programPageId,
  catalogSessions,
}: ProgramWorkspaceProps) {
  const workspace = useQuery(api.program.getWorkspace, {
    sessionToken,
    programPageId,
  });
  const createBlock = useMutation(api.program.createBlock);
  const renameBlock = useMutation(api.program.renameBlock);
  const removeBlock = useMutation(api.program.removeBlock);
  const assignSession = useMutation(api.program.assignSession);
  const unassignSession = useMutation(api.program.unassignSession);

  const [activeSession, setActiveSession] = useState<CatalogSession | null>(
    null,
  );
  const prompt = usePrompt();
  const confirm = useConfirm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const blockStats = useMemo(() => {
    const blocks = workspace?.blocks ?? [];
    return {
      count: blocks.length,
      totalMinutes: blocks.reduce((sum, block) => sum + block.totalMinutes, 0),
    };
  }, [workspace?.blocks]);

  function findSession(sessionId: Id<"sessions">): CatalogSession | undefined {
    const fromCatalog = catalogSessions.find((session) => session._id === sessionId);
    if (fromCatalog) return fromCatalog;
    for (const block of workspace?.blocks ?? []) {
      const fromBlock = block.sessions.find((session) => session._id === sessionId);
      if (fromBlock) return fromBlock;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const session = findSession(event.active.id as Id<"sessions">);
    setActiveSession(session ?? null);
  }

  function clearDragState() {
    setActiveSession(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const sessionId = event.active.id as Id<"sessions">;
    const overId = event.over?.id;
    clearDragState();
    if (!overId) return;

    if (overId === CATALOG_DROP_ID) {
      await unassignSession({ sessionToken, programPageId, sessionId });
      return;
    }

    const dropTarget = parseBlockDropId(String(overId));
    if (dropTarget) {
      await assignSession({
        sessionToken,
        blockId: dropTarget.blockId as Id<"blocks">,
        sessionId,
        insertAtIndex: dropTarget.insertAtIndex,
      });
    }
  }

  async function handleRenameBlock(blockId: Id<"blocks">) {
    const block = workspace?.blocks.find((entry) => entry._id === blockId);
    const name = await prompt({
      title: "Rename block",
      label: "Block name",
      defaultValue: block?.label ?? "",
    });
    if (!name?.trim()) return;
    await renameBlock({ sessionToken, blockId, label: name });
  }

  async function handleRemoveBlock(blockId: Id<"blocks">) {
    const block = workspace?.blocks.find((entry) => entry._id === blockId);
    const label = block?.label ?? "this block";
    const sessionNote =
      block && block.sessionCount > 0
        ? ` Its ${block.sessionCount} session${block.sessionCount === 1 ? "" : "s"} will return to the catalog.`
        : "";
    const confirmed = await confirm({
      title: "Remove block",
      description: `Remove "${label}"?${sessionNote}`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    await removeBlock({ sessionToken, blockId });
  }

  if (workspace === undefined) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading program…
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(260px,36%)_1fr]">
          <SessionCatalog
            sessions={catalogSessions}
            droppableId={CATALOG_DROP_ID}
            isDragActive={activeSession !== null}
          />
          <section className="flex min-h-0 min-w-0 flex-col bg-background">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/50 px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  {workspace.page.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Layers className="size-3" />
                    {blockStats.count} block{blockStats.count === 1 ? "" : "s"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {blockStats.totalMinutes} min scheduled
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => createBlock({ sessionToken, programPageId })}
              >
                <Plus className="size-4" />
                Add block
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-3 p-5">
                {workspace.blocks.length === 0 ? (
                  <Card className="mx-auto w-full max-w-md border-dashed shadow-none">
                    <CardHeader className="text-center">
                      <CardTitle className="text-base">No blocks yet</CardTitle>
                      <CardDescription>
                        Add a block, then drag sessions from the catalog on the
                        left.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  workspace.blocks.map((block) => (
                    <BlockPanel
                      key={block._id}
                      block={block}
                      activeDragId={activeSession?._id ?? null}
                      onRename={handleRenameBlock}
                      onRemove={(blockId) => void handleRemoveBlock(blockId)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </div>
      <DragOverlay
        dropAnimation={null}
        className="z-50 max-w-md cursor-grabbing rounded-lg shadow-xl"
      >
        {activeSession ? (
          <SessionCard session={activeSession} variant="timeline" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
