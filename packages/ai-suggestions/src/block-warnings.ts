import { evaluateBlock } from "@programionize/block-rules";
import type { BlockWarning } from "@programionize/block-rules";
import type { SuggestedGroup } from "./types.js";

export function attachBlockWarnings(groups: SuggestedGroup[]): SuggestedGroup[] {
  return groups.map((group) => {
    const { warnings } = evaluateBlock(
      group.sessions.map((session) => ({
        lengthMinutes: session.lengthMinutes,
        status: "active" as const,
      })),
    );
    return {
      ...group,
      warnings: warnings.map((warning) => ({
        code: warning.code,
        message: warning.message,
      })),
    };
  });
}

export type { BlockWarning };
