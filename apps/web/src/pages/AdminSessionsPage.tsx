import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { useAccess } from "../access/AccessContext";
import {
  AppHeaderSeparator,
  AppNavLink,
  AppShell,
} from "../components/AppShell";
import { useConfirm } from "../components/dialogs/DialogProvider";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ALL_TAB_ID,
  buildAdminSessionTabs,
  filterAdminSessionsByQuery,
  filterAdminSessionsByTab,
  type AdminSession,
} from "../lib/admin-sessions";
import { effectiveShowInCatalog } from "../lib/sessions";

function SessionTable({
  sessions,
  showStatusColumn,
  pendingId,
  onToggle,
}: {
  sessions: AdminSession[];
  showStatusColumn: boolean;
  pendingId: Id<"sessions"> | null;
  onToggle: (
    sessionId: Id<"sessions">,
    nextVisible: boolean,
    placementCount: number,
    title: string,
  ) => void;
}) {
  if (sessions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No sessions in this group.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Show in list</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Length</TableHead>
          {showStatusColumn ? <TableHead>Sessionize status</TableHead> : null}
          <TableHead>Import status</TableHead>
          <TableHead>In blocks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          const isVisible = effectiveShowInCatalog(session);
          const isPending = pendingId === session._id;
          return (
            <TableRow key={session._id}>
              <TableCell>
                {session.status === "removed" ? (
                  <span className="text-xs text-muted-foreground italic">
                    Withdrawn
                  </span>
                ) : (
                  <Button
                    variant={isVisible ? "outline" : "default"}
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      onToggle(
                        session._id,
                        !isVisible,
                        session.placementCount,
                        session.title,
                      )
                    }
                  >
                    {isPending
                      ? "Saving…"
                      : isVisible
                        ? "Hide from list"
                        : "Show in list"}
                  </Button>
                )}
              </TableCell>
              <TableCell className="font-medium">{session.title}</TableCell>
              <TableCell>{session.field ?? "—"}</TableCell>
              <TableCell>
                {session.lengthMinutes ? `${session.lengthMinutes} min` : "?"}
              </TableCell>
              {showStatusColumn ? (
                <TableCell>{session.sessionizeStatus ?? "—"}</TableCell>
              ) : null}
              <TableCell>{session.status}</TableCell>
              <TableCell>
                {session.placementCount > 0 ? (
                  <Badge variant="secondary">{session.placementCount}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function AdminSessionsPage() {
  const { sessionToken, signOut } = useAccess();
  const confirm = useConfirm();
  const sessions =
    useQuery(
      api.sessions.listForAdmin,
      sessionToken ? { sessionToken } : "skip",
    ) ?? [];
  const setShowInCatalog = useMutation(api.sessions.setShowInCatalog);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(ALL_TAB_ID);
  const [pendingId, setPendingId] = useState<Id<"sessions"> | null>(null);

  const tabs = useMemo(() => buildAdminSessionTabs(sessions), [sessions]);

  const filteredSessions = useMemo(() => {
    const tabbed = filterAdminSessionsByTab(sessions, activeTab);
    const searched = filterAdminSessionsByQuery(tabbed, query);
    return [...searched].sort((a, b) => a.title.localeCompare(b.title));
  }, [sessions, activeTab, query]);

  async function handleToggle(
    sessionId: Id<"sessions">,
    nextVisible: boolean,
    placementCount: number,
    title: string,
  ) {
    if (!sessionToken) return;
    if (!nextVisible && placementCount > 0) {
      const confirmed = await confirm({
        title: "Hide from catalog",
        description: `"${title}" is in ${placementCount} block${placementCount === 1 ? "" : "s"}. Hide it from the catalog anyway? It will stay in blocks with a warning.`,
        confirmLabel: "Hide",
        destructive: true,
      });
      if (!confirmed) return;
    }

    setPendingId(sessionId);
    try {
      await setShowInCatalog({
        sessionToken,
        sessionId,
        showInCatalog: nextVisible,
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AppShell
      title="Session catalog admin"
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
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">
          Toggle which sessions appear in the program editor catalog. Sessions
          hidden here stay in blocks but show dimmed with a warning.
        </p>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-start gap-0.5 px-4 py-2"
              >
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-xs text-muted-foreground">{tab.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Search sessions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search sessions"
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">
            {filteredSessions.length} shown
          </span>
        </div>
        <ScrollArea className="min-h-0 flex-1 rounded-lg border">
          <SessionTable
            sessions={filteredSessions}
            showStatusColumn={activeTab === ALL_TAB_ID}
            pendingId={pendingId}
            onToggle={(sessionId, nextVisible, placementCount, title) =>
              void handleToggle(sessionId, nextVisible, placementCount, title)
            }
          />
        </ScrollArea>
      </main>
    </AppShell>
  );
}
