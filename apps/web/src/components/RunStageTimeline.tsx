import { Badge } from "./ui/badge";

type Stage = {
  name: string;
  durationMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

const STAGE_LABELS: Record<string, string> = {
  preprocessing: "Preprocess",
  initialGrouping: "Grouping",
  blockCompletion_pass_1: "Completion 1",
  blockCompletion_pass_2: "Completion 2",
  reconciliation_pass_1: "Reconciliation",
  reconciliation_pass_2: "Reconciliation 2",
  critic: "Critic",
};

type RunStageTimelineProps = {
  stages: Stage[];
};

export function RunStageTimeline({ stages }: RunStageTimelineProps) {
  if (stages.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stage) => (
        <Badge key={stage.name} variant="outline" className="font-normal">
          {STAGE_LABELS[stage.name] ?? stage.name}
          <span className="ml-1 text-muted-foreground">
            {(stage.durationMs / 1000).toFixed(1)}s · {stage.usage.totalTokens} tok
          </span>
        </Badge>
      ))}
    </div>
  );
}

export function scopeLabel(scope: string | null | undefined): string {
  switch (scope) {
    case "full":
      return "Full catalog";
    case "page_unassigned":
      return "Page unassigned";
    case "page_regroup":
      return "Page regroup";
    case "block_complete":
      return "Block complete";
    case "block_review":
      return "Block review";
    default:
      return "AI run";
  }
}
