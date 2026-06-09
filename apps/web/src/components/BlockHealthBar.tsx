import { cn } from "@/lib/utils";

const MAX_SCALE_MINUTES = 90;
const TARGET_MIN = 80;
const TARGET_MAX = 90;

type BlockHealthBarProps = {
  totalMinutes: number;
  className?: string;
};

export function BlockHealthBar({ totalMinutes, className }: BlockHealthBarProps) {
  const fillPercent = Math.min((totalMinutes / MAX_SCALE_MINUTES) * 100, 100);
  const targetStart = (TARGET_MIN / MAX_SCALE_MINUTES) * 100;
  const targetWidth = ((TARGET_MAX - TARGET_MIN) / MAX_SCALE_MINUTES) * 100;

  const fillColor =
    totalMinutes > TARGET_MAX
      ? "bg-warning"
      : totalMinutes >= TARGET_MIN
        ? "bg-health-good"
        : "bg-primary";

  return (
    <div
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      role="progressbar"
      aria-valuenow={totalMinutes}
      aria-valuemin={0}
      aria-valuemax={MAX_SCALE_MINUTES}
      aria-label={`Block duration: ${totalMinutes} minutes`}
    >
      <div
        className="absolute inset-y-0 rounded-full bg-health-good opacity-25"
        style={{ left: `${targetStart}%`, width: `${targetWidth}%` }}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-all",
          fillColor,
        )}
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}
