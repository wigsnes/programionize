import type { BlockWarning } from "@programionize/block-rules";
import { isHiddenFromCatalog, type CatalogSession } from "./sessions";
import { getBlockWarnings } from "./block-status";

export type BlockHealthInput = {
  _id: string;
  label: string | null;
  sessions: CatalogSession[];
};

export type BlockHealthIssue = {
  blockId: string;
  blockLabel: string;
  warnings: BlockWarning[];
};

export type ProgramHealth = {
  score: number;
  issueCount: number;
  issues: BlockHealthIssue[];
};

function toBlockSessionInput(session: CatalogSession) {
  return {
    lengthMinutes: session.lengthMinutes,
    status: session.status,
    hiddenFromCatalog: isHiddenFromCatalog(session),
  };
}

export function computeProgramHealth(
  blocks: BlockHealthInput[],
): ProgramHealth {
  if (blocks.length === 0) {
    return { score: 100, issueCount: 0, issues: [] };
  }

  const issues: BlockHealthIssue[] = [];
  let healthyCount = 0;

  for (const block of blocks) {
    const warnings = getBlockWarnings(block.sessions.map(toBlockSessionInput));
    if (warnings.length === 0) {
      healthyCount += 1;
    } else {
      issues.push({
        blockId: block._id,
        blockLabel: block.label ?? "Untitled block",
        warnings,
      });
    }
  }

  const issueCount = issues.reduce(
    (sum, issue) => sum + issue.warnings.length,
    0,
  );
  const score = Math.round((healthyCount / blocks.length) * 100);

  return { score, issueCount, issues };
}
