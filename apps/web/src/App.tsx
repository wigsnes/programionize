import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { unassignedSessions } from "@programionize/program-layout";
import { useAccess } from "./access/AccessContext";
import {
  AppHeaderSeparator,
  AppNavLink,
  AppShell,
} from "./components/AppShell";
import { useConfirm, usePrompt } from "./components/dialogs/DialogProvider";
import { IssuesPanel } from "./components/IssuesPanel";
import { PageNav } from "./components/PageNav";
import { ProgramHealthBadge } from "./components/ProgramHealthBadge";
import { ProgramWorkspace } from "./components/ProgramWorkspace";
import { Button } from "./components/ui/button";
import { computeProgramHealth } from "./lib/program-health";

export function App() {
  const { sessionToken, signOut } = useAccess();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const [selectedPageId, setSelectedPageId] = useState<Id<"programPages"> | null>(
    null,
  );
  const [issuesOpen, setIssuesOpen] = useState(false);

  const pages =
    useQuery(
      api.program.listPages,
      sessionToken ? { sessionToken } : "skip",
    ) ?? [];

  const sessions =
    useQuery(
      api.sessions.list,
      sessionToken ? { sessionToken } : "skip",
    ) ?? [];

  const activePageId = useMemo((): Id<"programPages"> | null => {
    if (pages.length === 0) return null;
    if (
      selectedPageId &&
      pages.some((page) => page._id === selectedPageId)
    ) {
      return selectedPageId;
    }
    return pages[0]!._id;
  }, [pages, selectedPageId]);

  const workspace = useQuery(
    api.program.getWorkspace,
    sessionToken && activePageId
      ? { sessionToken, programPageId: activePageId }
      : "skip",
  );

  const createPage = useMutation(api.program.createPage);
  const renamePage = useMutation(api.program.renamePage);
  const deletePage = useMutation(api.program.deletePage);

  const catalogSessions = useMemo(() => {
    const assigned = new Set(workspace?.assignedSessionIds ?? []);
    return unassignedSessions(sessions, assigned);
  }, [sessions, workspace?.assignedSessionIds]);

  const programHealth = useMemo(
    () =>
      computeProgramHealth(
        (workspace?.blocks ?? []).map((block) => ({
          _id: block._id,
          label: block.label,
          sessions: block.sessions,
        })),
      ),
    [workspace?.blocks],
  );

  async function handleCreatePage() {
    if (!sessionToken) return;
    const name = await prompt({ title: "New page", label: "Page name" });
    if (!name?.trim()) return;
    const { pageId } = await createPage({ sessionToken, name });
    setSelectedPageId(pageId);
  }

  async function handleRenamePage(pageId: Id<"programPages">) {
    if (!sessionToken) return;
    const current = pages.find((page) => page._id === pageId);
    const name = await prompt({
      title: "Rename page",
      label: "Page name",
      defaultValue: current?.name ?? "",
    });
    if (!name?.trim()) return;
    await renamePage({ sessionToken, programPageId: pageId, name });
  }

  async function handleDeletePage(pageId: Id<"programPages">) {
    if (!sessionToken || pages.length <= 1) return;
    const current = pages.find((page) => page._id === pageId);
    const confirmed = await confirm({
      title: "Delete page",
      description: `Delete "${current?.name ?? "this page"}"? Blocks on this page will be removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    await deletePage({ sessionToken, programPageId: pageId });
    if (activePageId === pageId) {
      const remaining = pages.filter((page) => page._id !== pageId);
      setSelectedPageId(remaining[0]?._id ?? null);
    }
  }

  if (!sessionToken) return null;

  return (
    <AppShell
      title="Programionize"
      nav={
        <>
          <AppNavLink href="/" active>
            Pages
          </AppNavLink>
          <AppNavLink href="/suggestions">AI suggestions</AppNavLink>
          <AppNavLink href="/admin">Admin</AppNavLink>
        </>
      }
      health={
        activePageId ? (
          <ProgramHealthBadge
            health={programHealth}
            onClick={() => setIssuesOpen(true)}
          />
        ) : null
      }
      actions={
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign out
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <PageNav
          pages={pages}
          selectedPageId={activePageId}
          onSelect={(pageId) =>
            setSelectedPageId(pageId as Id<"programPages">)
          }
          onCreate={handleCreatePage}
          onRename={(pageId) =>
            handleRenamePage(pageId as Id<"programPages">)
          }
          onDelete={(pageId) =>
            handleDeletePage(pageId as Id<"programPages">)
          }
        />
        {activePageId ? (
          <ProgramWorkspace
            sessionToken={sessionToken}
            programPageId={activePageId}
            catalogSessions={catalogSessions}
          />
        ) : (
          <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Create a program page to begin.
          </p>
        )}
      </div>
      <IssuesPanel
        health={programHealth}
        open={issuesOpen}
        onOpenChange={setIssuesOpen}
      />
    </AppShell>
  );
}
