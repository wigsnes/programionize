import type { SuggestedGroup } from "@programionize/ai-suggestions";
import { AlertTriangle, Copy, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fieldStripeColor } from "@/lib/field-colors";
import { BlockHealthBar } from "./BlockHealthBar";

type SuggestionGroupCardProps = {
  group: SuggestedGroup;
  onCopy: () => void;
  onApply: () => void;
  applying?: boolean;
  applyDisabled?: boolean;
};

export function suggestionGroupKey(group: SuggestedGroup): string {
  return group.sessions.map((session) => session.sessionizeId).join("-");
}

export function SuggestionGroupCard({
  group,
  onCopy,
  onApply,
  applying = false,
  applyDisabled = false,
}: SuggestionGroupCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>
              {group.sessions.length} sessions · {group.totalMinutes} min
            </CardDescription>
            <BlockHealthBar totalMinutes={group.totalMinutes} />
            {group.warnings.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {group.warnings.map((warning) => (
                  <li key={warning.code}>
                    <Badge
                      variant="outline"
                      className="gap-1 border-warning text-warning"
                    >
                      <AlertTriangle className="size-3" />
                      {warning.message}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="size-4" />
              Copy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onApply}
              disabled={applyDisabled || applying}
            >
              <Plus className="size-4" />
              {applying ? "Applying…" : "Apply"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{group.rationale}</p>
        <ul className="space-y-1.5 text-sm">
          {group.sessions.map((session) => (
            <li
              key={session.sessionizeId}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5"
            >
              <span
                className="size-1 shrink-0 self-stretch rounded-full"
                style={{
                  backgroundColor: fieldStripeColor(session.field),
                  minHeight: "1.25rem",
                }}
              />
              <span className="min-w-0 flex-1 font-medium">{session.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {session.lengthMinutes ? `${session.lengthMinutes} min` : "?"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
