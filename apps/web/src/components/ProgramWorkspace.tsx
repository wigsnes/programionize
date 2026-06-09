import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { Layers, PanelLeftOpen, Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  CATALOG_DROP_ID,
  parseBlockDropId,
  programCollisionDetection,
} from "../lib/dnd";
import { dragHintMessage, sessionFitsBlock } from "../lib/drag-preview";
import type { CatalogSession } from "../lib/sessions";
import { useConfirm, usePrompt } from "./dialogs/DialogProvider";
import { BlockPanel } from "./BlockPanel";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "./CommandPalette";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
  const [selectedBlockId, setSelectedBlockId] =
    useState<Id<"blocks"> | null>(null);
  const [catalogCollapsed, setCatalogCollapsed] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<Id<"blocks"> | null>(
    null,
  );
  const prompt = usePrompt();
  const confirm = useConfirm();

  const openCommandPalette = useCallback(() => setCommandOpen(true), []);
  useCommandPaletteShortcut(openCommandPalette);

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

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId || !workspace) return null;
    return workspace.blocks.find((block) => block._id === selectedBlockId) ?? null;
  }, [selectedBlockId, workspace]);

  const dragHint = useMemo(() => {
    if (!activeSession || !workspace || !hoveredBlockId) return null;
    const block = workspace.blocks.find((entry) => entry._id === hoveredBlockId);
    if (!block) return null;
    return dragHintMessage(block, activeSession);
  }, [activeSession, workspace, hoveredBlockId]);

  function findSession(sessionId: string): CatalogSession | undefined {
    const fromCatalog = catalogSessions.find(
      (session) => String(session._id) === sessionId,
    );
    if (fromCatalog) return fromCatalog;
    for (const block of workspace?.blocks ?? []) {
      const fromBlock = block.sessions.find(
        (session) => String(session._id) === sessionId,
      );
      if (fromBlock) return fromBlock;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const session = findSession(String(event.active.id));
    setActiveSession(session ?? null);
  }

  function clearDragState() {
    setActiveSession(null);
    setHoveredBlockId(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id;
    if (!overId) {
      setHoveredBlockId(null);
      return;
    }

    if (overId === CATALOG_DROP_ID) {
      setHoveredBlockId(null);
      return;
    }

    const dropTarget = parseBlockDropId(String(overId));
    if (dropTarget) {
      setHoveredBlockId(dropTarget.blockId as Id<"blocks">);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const sessionId = String(event.active.id) as Id<"sessions">;
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
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    await removeBlock({ sessionToken, blockId });
  }

  function focusCatalogSearch() {
    if (isDesktop) {
      setCatalogCollapsed(false);
    } else {
      setMobileCatalogOpen(true);
    }
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(
        "[data-catalog-search]",
      );
      input?.focus();
    });
  }

  if (workspace === undefined) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading program…
      </p>
    );
  }

  const allSessions = [
    ...catalogSessions,
    ...workspace.blocks.flatMap((block) => block.sessions),
  ];

  const catalogProps = {
    sessions: catalogSessions,
    droppableId: CATALOG_DROP_ID,
    isDragActive: activeSession !== null,
    selectedBlock: selectedBlock
      ? {
          sessionCount: selectedBlock.sessionCount,
          totalMinutes: selectedBlock.totalMinutes,
        }
      : null,
    selectedBlockLabel: selectedBlock?.label ?? null,
  };

  const blockList = (
    <div className="flex flex-col gap-4 p-6 max-lg:gap-3 max-lg:p-4">
      {workspace.blocks.length === 0 ? (
        <Card className="mx-auto w-full max-w-md border-dashed shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-base">No blocks yet</CardTitle>
            <CardDescription>
              Add a block, then drag sessions from the catalog.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        workspace.blocks.map((block) => (
          <BlockPanel
            key={block._id}
            block={block}
            activeDragId={activeSession ? String(activeSession._id) : null}
            isSelected={selectedBlockId === block._id}
            isDropCompatible={
              activeSession !== null &&
              sessionFitsBlock(activeSession, block)
            }
            onSelect={setSelectedBlockId}
            onRename={handleRenameBlock}
            onRemove={(blockId) => void handleRemoveBlock(blockId)}
          />
        ))
      )}
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={programCollisionDetection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {isDesktop && !catalogCollapsed ? (
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(280px,32%)_1fr]">
            <SessionCatalog
              {...catalogProps}
              onToggleCollapse={() => setCatalogCollapsed(true)}
            />
            <section className="flex min-h-0 min-w-0 flex-col bg-background">
              <WorkspaceHeader
                pageName={workspace.page.name}
                blockStats={blockStats}
                onCreateBlock={() =>
                  createBlock({ sessionToken, programPageId })
                }
              />
              <div className="min-h-0 flex-1 overflow-y-auto">{blockList}</div>
            </section>
          </div>
        ) : isDesktop && catalogCollapsed ? (
          <div className="flex min-h-0 min-w-0 flex-1">
            <SessionCatalog
              {...catalogProps}
              collapsed
              onToggleCollapse={() => setCatalogCollapsed(false)}
            />
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
              <WorkspaceHeader
                pageName={workspace.page.name}
                blockStats={blockStats}
                onCreateBlock={() =>
                  createBlock({ sessionToken, programPageId })
                }
              />
              <div className="min-h-0 flex-1 overflow-y-auto">{blockList}</div>
            </section>
          </div>
        ) : (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
            <WorkspaceHeader
              pageName={workspace.page.name}
              blockStats={blockStats}
              onCreateBlock={() =>
                createBlock({ sessionToken, programPageId })
              }
              mobile
              onOpenCatalog={() => setMobileCatalogOpen(true)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto">{blockList}</div>
          </section>
        )}
      </div>

      {!isDesktop ? (
        <Sheet open={mobileCatalogOpen} onOpenChange={setMobileCatalogOpen}>
          <SheetContent side="bottom" className="h-[70vh] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Session catalog</SheetTitle>
            </SheetHeader>
            <SessionCatalog {...catalogProps} mobileSheet />
          </SheetContent>
        </Sheet>
      ) : null}

      <DragOverlay
        dropAnimation={null}
        modifiers={[snapCenterToCursor]}
        className="z-50 max-w-md cursor-grabbing rounded-lg shadow-xl"
      >
        {activeSession ? (
          <div>
            <SessionCard session={activeSession} variant="timeline" />
            {dragHint ? (
              <p className="mt-1 rounded-md bg-foreground/90 px-2 py-1 text-center text-xs text-background">
                {dragHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
      <CommandPalette
        sessions={allSessions}
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onFocusCatalog={focusCatalogSearch}
      />
    </DndContext>
  );
}

function WorkspaceHeader({
  pageName,
  blockStats,
  onCreateBlock,
  mobile = false,
  onOpenCatalog,
}: {
  pageName: string;
  blockStats: { count: number; totalMinutes: number };
  onCreateBlock: () => void;
  mobile?: boolean;
  onOpenCatalog?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/50 px-6 py-4 max-lg:px-4 max-lg:py-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold max-lg:text-base">
          {pageName}
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
      <div className="flex items-center gap-1">
        {mobile && onOpenCatalog ? (
          <Button variant="outline" size="sm" onClick={onOpenCatalog}>
            <PanelLeftOpen className="size-4" />
            Sessions
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onCreateBlock}>
          <Plus className="size-4" />
          <span className="max-lg:sr-only">Add block</span>
        </Button>
      </div>
    </div>
  );
}
