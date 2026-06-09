import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BlockStatus } from "@/lib/block-status";

const statusConfig: Record<
  BlockStatus,
  { label: string; className: string } | null
> = {
  good: {
    label: "Good",
    className:
      "border-health-good bg-health-good/15 text-health-good",
  },
  building: {
    label: "Building",
    className: "border-primary bg-accent text-primary",
  },
  warning: {
    label: "Warning",
    className:
      "border-warning bg-warning/15 text-warning",
  },
  empty: null,
};

type BlockStatusPillProps = {
  status: BlockStatus;
  className?: string;
};

export function BlockStatusPill({ status, className }: BlockStatusPillProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn("text-[0.65rem] font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
