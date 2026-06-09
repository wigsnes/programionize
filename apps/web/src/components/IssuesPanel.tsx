import { AlertTriangle } from "lucide-react";
import type { ProgramHealth } from "@/lib/program-health";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

type IssuesPanelProps = {
  health: ProgramHealth;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IssuesPanel({ health, open, onOpenChange }: IssuesPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Program issues</DialogTitle>
          <DialogDescription>
            {health.issueCount === 0
              ? "All blocks look good."
              : `${health.issueCount} issue${health.issueCount === 1 ? "" : "s"} across ${health.issues.length} block${health.issues.length === 1 ? "" : "s"}.`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {health.issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No warnings on any block.
            </p>
          ) : (
            <ul className="space-y-4 pr-4">
              {health.issues.map((issue) => (
                <li key={issue.blockId}>
                  <h4 className="text-sm font-medium">{issue.blockLabel}</h4>
                  <ul className="mt-1.5 space-y-1">
                    {issue.warnings.map((warning) => (
                      <li
                        key={warning.code}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
