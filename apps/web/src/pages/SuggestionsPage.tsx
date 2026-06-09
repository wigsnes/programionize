import { formatGroupForClipboard } from "@programionize/ai-suggestions";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import { Copy, Sparkles } from "lucide-react";
import { useAccess } from "../access/AccessContext";
import {
  AppHeaderSeparator,
  AppNavLink,
  AppShell,
} from "../components/AppShell";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { formatSuggestionError } from "../lib/suggestion-errors";

export function SuggestionsPage() {
  const { sessionToken, signOut } = useAccess();
  const latest = useQuery(
    api.suggestions.getLatest,
    sessionToken ? { sessionToken } : "skip",
  );
  const generate = useAction(api.suggestionsGenerate.generate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const groups = latest?.groups ?? [];

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

  async function handleCopy(
    group: (typeof groups)[number],
  ): Promise<void> {
    const text = formatGroupForClipboard(group);
    await navigator.clipboard.writeText(text);
    setCopyStatus(`Copied "${group.title}"`);
    window.setTimeout(() => setCopyStatus(null), 2000);
  }

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
          Thematic groupings from session titles and descriptions (Accept queue
          and Accepted only). Advisory only — copy a group and build blocks
          manually on a program page.
        </p>
        <div className="mb-6 flex items-center gap-4">
          <Button onClick={handleGenerate} disabled={loading || !sessionToken}>
            <Sparkles className="size-4" />
            {loading ? "Generating…" : "Generate suggestions"}
          </Button>
          {copyStatus ? (
            <span className="text-sm text-green-700 dark:text-green-400">
              {copyStatus}
            </span>
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
            No suggestions yet. Import sessions, then generate.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {groups.map((group) => (
              <li key={group.title}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{group.title}</CardTitle>
                        <CardDescription>
                          {group.sessions.length} sessions · {group.totalMinutes}{" "}
                          min
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(group)}
                      >
                        <Copy className="size-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      {group.rationale}
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {group.sessions.map((session) => (
                        <li key={session.sessionizeId}>
                          {session.title}
                          {session.lengthMinutes
                            ? ` (${session.lengthMinutes} min)`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
