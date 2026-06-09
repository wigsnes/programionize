import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { CatalogSession } from "@/lib/sessions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  sessions: CatalogSession[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFocusCatalog?: () => void;
};

export function CommandPalette({
  sessions,
  open,
  onOpenChange,
  onFocusCatalog,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sessions.slice(0, 20);
    return sessions
      .filter((session) => {
        const haystack = [
          session.title,
          session.description ?? "",
          session.field ?? "",
          ...session.speakerNames,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 20);
  }, [sessions, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick find</DialogTitle>
          <DialogDescription>Search sessions by title or speaker</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a session…"
            className="border-0 shadow-none focus-visible:ring-0"
            autoFocus
            aria-label="Quick find sessions"
          />
        </div>
        <ScrollArea className="max-h-72">
          <ul className="p-2">
            {results.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                No sessions found
              </li>
            ) : (
              results.map((session) => (
                <li key={session._id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                    )}
                    onClick={() => {
                      onFocusCatalog?.();
                      onOpenChange(false);
                    }}
                  >
                    <span className="font-medium">{session.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.field ?? "No field"} ·{" "}
                      {session.lengthMinutes ?? "?"} min
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </ScrollArea>
        <p className="border-t px-3 py-2 text-[0.65rem] text-muted-foreground">
          Press Esc to close · Cmd/Ctrl+K to open
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
