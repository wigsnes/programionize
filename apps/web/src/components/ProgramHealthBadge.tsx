import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProgramHealth } from "@/lib/program-health";

type ProgramHealthBadgeProps = {
  health: ProgramHealth;
  onClick?: () => void;
  className?: string;
};

export function ProgramHealthBadge({
  health,
  onClick,
  className,
}: ProgramHealthBadgeProps) {
  const isHealthy = health.issueCount === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={`Program health: ${health.score}% healthy, ${health.issueCount} issues`}
    >
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 tabular-nums",
          isHealthy
            ? "border-health-good bg-health-good/15 text-health-good"
            : "border-warning bg-warning/15 text-warning",
        )}
      >
        {isHealthy ? null : <AlertTriangle className="size-3" />}
        {health.score}% healthy
        {health.issueCount > 0 ? ` · ${health.issueCount} issues` : ""}
      </Badge>
    </button>
  );
}
