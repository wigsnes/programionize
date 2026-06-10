import { compactSessionDescription } from "@programionize/ai-suggestions";
import type { Block, Session } from "../types.js";

export function sessionsToPromptString(sessions: Session[]): string {
  return sessions.map(formatSessionLine).join("\n");
}

export function formatSessionLine(session: Session): string {
  const discipline =
    session.disciplines.length > 0
      ? `[${session.disciplines.join(", ")}] `
      : "";
  const keywords =
    session.keywords.length > 0
      ? `keywords: ${session.keywords.join(", ")} | `
      : "";
  const description = compactSessionDescription(session.description);
  return `- id=${session.id} | ${discipline}${session.title} | ${session.duration} min | ${keywords}${description}`;
}

export function formatBlockForPrompt(block: Block): string {
  const lines = [
    `Block id=${block.id}`,
    `Primary discipline: ${block.primaryDiscipline}`,
    `Total duration: ${block.totalDuration} min`,
    `Rationale: ${block.rationale}`,
    "Sessions:",
    sessionsToPromptString(block.sessions),
  ];
  return lines.join("\n");
}

export function formatBlocksForCritic(blocks: Block[]): string {
  return blocks.map(formatBlockForPrompt).join("\n\n---\n\n");
}
