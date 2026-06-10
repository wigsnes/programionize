import {
  buildApplyPreview,
  buildBulkApplyPreview,
  formatApplyPreviewSummary,
  formatGroupForClipboard,
  type SuggestedGroup,
} from "@programionize/ai-suggestions";
import { useAction, useMutation, useQuery } from "convex/react";
import { ExternalLink, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { useConfirm } from "./dialogs/DialogProvider";
import { RunStageTimeline, scopeLabel } from "./RunStageTimeline";
import { SuggestionGroupCard } from "./SuggestionGroupCard";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { formatSuggestionError } from "../lib/suggestion-errors";

type AiHelperPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
  programPageId: Id<"programPages">;
  pageName: string;
  blockCount: number;
  placedCount: number;
  unassignedCount: number;
  focusBlockId?: Id<"blocks"> | null;
  workspaceBlocks: Array<{
    _id: Id<"blocks">;
    label: string | null;
    sessions: Array<{ sessionizeId: string; title: string }>;
  }>;
};

export function AiHelperPanel({
  open,
  onOpenChange,
  sessionToken,
  programPageId,
  pageName,
  blockCount,
  placedCount,
  unassignedCount,
  focusBlockId,
  workspaceBlocks,
}: AiHelperPanelProps) {
  const confirm = useConfirm();
  const latest = useQuery(
    api.suggestions.getLatest,
    sessionToken && open ? { sessionToken } : "skip",
  );

  const generateForPage = useAction(api.aiBlockingActions.generateForPage);
  const completeBlock = useAction(api.aiBlockingActions.completeBlock);
  const reviewBlock = useAction(api.aiBlockingActions.reviewBlock);
  const enrichProfiles = useAction(api.aiEnrich.enrichProfiles);
  const applyGroup = useMutation(api.suggestionsApply.applySuggestionGroup);
  const applyAll = useMutation(api.suggestionsApply.applyAllSuggestionGroups);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewGroups, setPreviewGroups] = useState<SuggestedGroup[]>([]);
  const [previewMeta, setPreviewMeta] = useState<{
    scope?: string | null;
    stages?: Array<{
      name: string;
      durationMs: number;
      usage: { totalTokens: number; promptTokens: number; completionTokens: number };
    }>;
  } | null>(null);

  const focusBlock = useMemo(
    () => workspaceBlocks.find((block) => block._id === focusBlockId) ?? null,
    [workspaceBlocks, focusBlockId],
  );

  async function runAction(
    key: string,
    action: () => Promise<{ groups: SuggestedGroup[]; metadata?: { scope?: string; stages?: typeof previewMeta extends null ? never : NonNullable<typeof previewMeta>["stages"] } }>,
  ) {
    setLoading(key);
    setError(null);
    try {
      const result = await action();
      setPreviewGroups(result.groups);
      setPreviewMeta(result.metadata ?? null);
    } catch (err) {
      setError(formatSuggestionError(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleApplyGroup(group: SuggestedGroup) {
    const preview = buildApplyPreview(group, workspaceBlocks);
    const confirmed = await confirm({
      title: `Apply "${group.title}"?`,
      description: formatApplyPreviewSummary(preview),
      confirmLabel: "Apply to page",
    });
    if (!confirmed) return;
    await applyGroup({
      sessionToken,
      programPageId,
      groupTitle: group.title,
      sessionizeIds: group.sessions.map((s) => s.sessionizeId),
    });
  }

  async function handleApplyAll() {
    if (previewGroups.length === 0) return;
    const bulk = buildBulkApplyPreview(previewGroups, workspaceBlocks);
    const confirmed = await confirm({
      title: `Apply all ${bulk.totalNewBlocks} groups?`,
      description: `Creates ${bulk.totalNewBlocks} blocks on "${pageName}".`,
      confirmLabel: "Apply all",
    });
    if (!confirmed) return;
    await applyAll({
      sessionToken,
      programPageId,
      groups: previewGroups.map((group) => ({
        title: group.title,
        sessionizeIds: group.sessions.map((s) => s.sessionizeId),
      })),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI Helper
          </SheetTitle>
          <SheetDescription>
            {pageName}: {blockCount} blocks, {placedCount} placed, {unassignedCount}{" "}
            unassigned in catalog
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() =>
              void runAction("unassigned", () =>
                generateForPage({
                  sessionToken,
                  programPageId,
                  mode: "unassigned",
                }),
              )
            }
          >
            {loading === "unassigned" ? "Running…" : "Group unassigned on page"}
          </Button>
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() =>
              void runAction("regroup", () =>
                generateForPage({
                  sessionToken,
                  programPageId,
                  mode: "regroup",
                }),
              )
            }
          >
            {loading === "regroup" ? "Running…" : "Suggest full page layout"}
          </Button>
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() =>
              void enrichProfiles({ sessionToken, force: true }).then(() =>
                setError(null),
              )
            }
          >
            Refresh AI profiles
          </Button>
          {focusBlock ? (
            <>
              <Button
                variant="outline"
                disabled={loading !== null}
                onClick={() =>
                  void runAction("complete", () =>
                    completeBlock({
                      sessionToken,
                      programPageId,
                      blockId: focusBlock._id,
                    }),
                  )
                }
              >
                {loading === "complete"
                  ? "Running…"
                  : `Complete "${focusBlock.label ?? "block"}"`}
              </Button>
              <Button
                variant="outline"
                disabled={loading !== null}
                onClick={() =>
                  void runAction("review", () =>
                    reviewBlock({
                      sessionToken,
                      programPageId,
                      blockId: focusBlock._id,
                    }),
                  )
                }
              >
                {loading === "review"
                  ? "Running…"
                  : `Review "${focusBlock.label ?? "block"}"`}
              </Button>
            </>
          ) : null}
          <a
            href="/suggestions"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open full AI inspector
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {previewGroups.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                Preview ({previewGroups.length} groups)
                {previewMeta?.scope ? (
                  <span className="ml-2 text-muted-foreground">
                    {scopeLabel(previewMeta.scope)}
                  </span>
                ) : null}
              </p>
              <Button size="sm" onClick={() => void handleApplyAll()}>
                Apply all
              </Button>
            </div>
            {previewMeta?.stages ? (
              <RunStageTimeline stages={previewMeta.stages} />
            ) : null}
            <ul className="flex flex-col gap-3">
              {previewGroups.map((group) => {
                const key = group.sessions.map((s) => s.sessionizeId).join("-");
                return (
                  <li key={key}>
                    <SuggestionGroupCard
                      group={group}
                      onCopy={() =>
                        void navigator.clipboard.writeText(
                          formatGroupForClipboard(group),
                        )
                      }
                      onApply={() => void handleApplyGroup(group)}
                      applying={false}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : latest?.groups && latest.groups.length > 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Latest run: {latest.groups.length} groups from{" "}
            {scopeLabel(latest.scope)}. Run an action above for a fresh preview.
          </p>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
