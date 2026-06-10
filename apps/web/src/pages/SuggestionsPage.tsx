import {
  buildApplyPreview,
  buildBulkApplyPreview,
  formatApplyPreviewSummary,
  formatGroupForClipboard,
  type SuggestedGroup,
} from "@programionize/ai-suggestions";
import { useAction, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import { useAccess } from "../access/AccessContext";
import {
  AppHeaderSeparator,
  AppNavLink,
  AppShell,
} from "../components/AppShell";
import { useConfirm } from "../components/dialogs/DialogProvider";
import { RunStageTimeline, scopeLabel } from "../components/RunStageTimeline";
import { SessionAiTable } from "../components/SessionAiTable";
import { SuggestionGroupCard } from "../components/SuggestionGroupCard";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatSuggestionError } from "../lib/suggestion-errors";
import { buildSessionAiRows } from "../lib/session-ai-rows";

export function SuggestionsPage() {
  const { sessionToken, signOut } = useAccess();
  const confirm = useConfirm();

  const latest = useQuery(
    api.suggestions.getLatest,
    sessionToken ? { sessionToken } : "skip",
  );
  const pages =
    useQuery(
      api.program.listPages,
      sessionToken ? { sessionToken } : "skip",
    ) ?? [];

  const [selectedPageId, setSelectedPageId] = useState<Id<"programPages"> | null>(
    null,
  );
  const activePageId = useMemo((): Id<"programPages"> | null => {
    if (pages.length === 0) return null;
    if (
      selectedPageId &&
      pages.some((page) => page._id === selectedPageId)
    ) {
      return selectedPageId;
    }
    return pages[0]?._id ?? null;
  }, [pages, selectedPageId]);

  const workspace = useQuery(
    api.program.getWorkspace,
    sessionToken && activePageId
      ? { sessionToken, programPageId: activePageId }
      : "skip",
  );

  const gapAnalysis = useQuery(
    api.suggestions.getPageGapAnalysis,
    sessionToken && activePageId
      ? { sessionToken, programPageId: activePageId }
      : "skip",
  );

  const sessionProfiles = useQuery(
    api.suggestions.getSessionProfiles,
    sessionToken ? { sessionToken } : "skip",
  );

  const generate = useAction(api.suggestionsGenerate.generate);
  const applyGroup = useMutation(api.suggestionsApply.applySuggestionGroup);
  const applyAll = useMutation(api.suggestionsApply.applyAllSuggestionGroups);

  const [loading, setLoading] = useState(false);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);

  const groups = latest?.groups ?? [];
  const report = latest?.report ?? null;
  const metadata = latest?.metadata ?? null;

  const sessionAiRows = useMemo(
    () =>
      buildSessionAiRows(
        sessionProfiles ?? [],
        metadata?.sessionTraces,
        groups,
      ),
    [sessionProfiles, metadata?.sessionTraces, groups],
  );

  const workspaceBlocks = useMemo(
    () =>
      (workspace?.blocks ?? []).map((block) => ({
        _id: block._id,
        label: block.label,
        sessions: block.sessions.map((session) => ({
          sessionizeId: session.sessionizeId,
          title: session.title,
        })),
      })),
    [workspace?.blocks],
  );

  async function handleGenerate() {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      await generate({ sessionToken });
    } catch (err) {
      setError(formatSuggestionError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(group: SuggestedGroup): Promise<void> {
    const text = formatGroupForClipboard(group);
    await navigator.clipboard.writeText(text);
    setCopyStatus(`Copied "${group.title}"`);
    window.setTimeout(() => setCopyStatus(null), 2000);
  }

  async function handleApplyGroup(group: SuggestedGroup) {
    if (!sessionToken || !activePageId) return;

    const preview = buildApplyPreview(group, workspaceBlocks);
    const confirmed = await confirm({
      title: `Apply "${group.title}"?`,
      description: formatApplyPreviewSummary(preview),
      confirmLabel: "Apply to page",
    });
    if (!confirmed) return;

    const key = group.sessions.map((s) => s.sessionizeId).join("-");
    setApplyingKey(key);
    setApplyStatus(null);
    try {
      const result = await applyGroup({
        sessionToken,
        programPageId: activePageId,
        groupTitle: group.title,
        sessionizeIds: group.sessions.map((s) => s.sessionizeId),
      });
      const pageName = pages.find((p) => p._id === activePageId)?.name ?? "page";
      setApplyStatus(
        `Created block on "${pageName}" (${result.assigned.length} sessions${result.moved > 0 ? `, ${result.moved} moved` : ""})`,
      );
    } catch (err) {
      setError(formatSuggestionError(err));
    } finally {
      setApplyingKey(null);
    }
  }

  async function handleApplyAll() {
    if (!sessionToken || !activePageId || groups.length === 0) return;

    const bulk = buildBulkApplyPreview(groups, workspaceBlocks);
    const confirmed = await confirm({
      title: `Apply all ${bulk.totalNewBlocks} groups?`,
      description: `Creates ${bulk.totalNewBlocks} blocks with ${bulk.totalSessions} sessions on "${pages.find((p) => p._id === activePageId)?.name ?? "page"}".${bulk.totalMoves > 0 ? ` ${bulk.totalMoves} sessions will move from existing blocks.` : ""}`,
      confirmLabel: "Apply all",
    });
    if (!confirmed) return;

    setApplyingAll(true);
    setApplyStatus(null);
    try {
      const result = await applyAll({
        sessionToken,
        programPageId: activePageId,
        groups: groups.map((group) => ({
          title: group.title,
          sessionizeIds: group.sessions.map((s) => s.sessionizeId),
        })),
      });
      setApplyStatus(
        `Created ${result.results.length} blocks (${result.results.reduce((sum: number, r: { assigned: number }) => sum + r.assigned, 0)} sessions)`,
      );
    } catch (err) {
      setError(formatSuggestionError(err));
    } finally {
      setApplyingAll(false);
    }
  }

  const generatedAt = latest?.createdAt
    ? new Date(latest.createdAt).toLocaleString()
    : null;

  return (
    <AppShell
      title="AI suggestions"
      actions={
        <>
          <AppNavLink href="/">Program editor</AppNavLink>
          <AppHeaderSeparator />
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </>
      }
    >
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-auto p-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Thematic groupings from session titles, fields, and descriptions. Uses
          sessions visible in the program catalog (Accept queue / Accepted by
          default, plus any you explicitly show in Admin). Preview before
          applying to a program page.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Apply to page</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={activePageId ?? ""}
              onChange={(event) =>
                setSelectedPageId(event.target.value as Id<"programPages">)
              }
              disabled={pages.length === 0}
            >
              {pages.length === 0 ? (
                <option value="">No pages</option>
              ) : (
                pages.map((page) => (
                  <option key={page._id} value={page._id}>
                    {page.name}
                  </option>
                ))
              )}
            </select>
          </label>
          {activePageId ? (
            <a
              href="/"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open in editor
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button onClick={handleGenerate} disabled={loading || !sessionToken}>
            <Sparkles className="size-4" />
            {loading ? "Generating…" : "Generate full catalog"}
          </Button>
          {groups.length > 0 && activePageId ? (
            <Button
              variant="outline"
              onClick={() => void handleApplyAll()}
              disabled={applyingAll || loading}
            >
              {applyingAll ? "Applying all…" : `Apply all ${groups.length} groups`}
            </Button>
          ) : null}
          {copyStatus ? (
            <span className="text-sm text-health-good">{copyStatus}</span>
          ) : null}
          {applyStatus ? (
            <span className="text-sm text-health-good">{applyStatus}</span>
          ) : null}
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {latest === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No suggestions yet. Import sessions in Admin, then generate.
          </p>
        ) : (
          <>
            {report ? (
              <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  {generatedAt ? <span>Generated {generatedAt}</span> : null}
                  {latest?.model ? <span>Model: {latest.model}</span> : null}
                  {latest?.scope ? (
                    <Badge variant="secondary">{scopeLabel(latest.scope)}</Badge>
                  ) : null}
                  <span>
                    Grouped {report.groupedSessionCount} of{" "}
                    {report.inputSessionCount} sessions
                  </span>
                </div>
                {metadata?.stages ? (
                  <div className="mt-3">
                    <RunStageTimeline stages={metadata.stages} />
                  </div>
                ) : null}
                {report.uncoveredSessions.length > 0 ? (
                  <Alert className="mt-3">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>
                      {report.uncoveredSessions.length} session
                      {report.uncoveredSessions.length === 1 ? "" : "s"} not
                      placed:{" "}
                      {report.uncoveredSessions
                        .slice(0, 5)
                        .map((s) => s.title)
                        .join(", ")}
                      {report.uncoveredSessions.length > 5
                        ? ` and ${report.uncoveredSessions.length - 5} more`
                        : ""}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {report.duplicateSessionIds.length > 0 ? (
                  <p className="mt-2 text-xs text-warning">
                    {report.duplicateSessionIds.length} duplicate assignment
                    {report.duplicateSessionIds.length === 1 ? "" : "s"} removed
                  </p>
                ) : null}
              </div>
            ) : null}

            {gapAnalysis && gapAnalysis.unassigned.length > 0 ? (
              <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">
                  {gapAnalysis.unassigned.length} catalog session
                  {gapAnalysis.unassigned.length === 1 ? "" : "s"} not yet on "
                  {gapAnalysis.pageName}"
                </p>
                <p className="mt-1 text-muted-foreground">
                  {gapAnalysis.unassigned
                    .slice(0, 6)
                    .map((s) => s.title)
                    .join(" · ")}
                  {gapAnalysis.unassigned.length > 6
                    ? ` · +${gapAnalysis.unassigned.length - 6} more`
                    : ""}
                </p>
              </div>
            ) : null}

            <Tabs defaultValue="groups" className="mt-4">
              <TabsList>
                <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
                <TabsTrigger value="sessions">Session AI data</TabsTrigger>
              </TabsList>
              <TabsContent value="groups" className="mt-4">
                <ul className="flex flex-col gap-4">
                  {groups.map((group) => {
                    const key = group.sessions
                      .map((s) => s.sessionizeId)
                      .join("-");
                    return (
                      <li key={key}>
                        <SuggestionGroupCard
                          group={group}
                          onCopy={() => void handleCopy(group)}
                          onApply={() => void handleApplyGroup(group)}
                          applying={applyingKey === key}
                          applyDisabled={!activePageId || applyingAll}
                        />
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
              <TabsContent value="sessions" className="mt-4">
                <SessionAiTable rows={sessionAiRows} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </AppShell>
  );
}
