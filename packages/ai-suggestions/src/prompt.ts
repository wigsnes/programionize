import type { SuggestionInputSession } from "./types.js";

/** Keeps prompts under OpenAI TPM limits when Sessionize descriptions are large. */
export const DESCRIPTION_MAX_CHARS = 350;
export const SESSIONS_PER_PROMPT = 80;

export function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function compactSessionDescription(
  description: string | null,
  maxChars = DESCRIPTION_MAX_CHARS,
): string {
  if (!description?.trim()) return "(no description)";
  const plain = stripHtml(description).replace(/\s+/g, " ").trim();
  if (plain.length <= maxChars) return plain;
  return `${plain.slice(0, maxChars - 1)}…`;
}

function formatSessionLine(session: SuggestionInputSession): string {
  const minutes = session.lengthMinutes ?? "?";
  const field = session.field ? `[${session.field}] ` : "";
  const speakers =
    session.speakerNames.length > 0
      ? `speakers: ${session.speakerNames.join(", ")} | `
      : "";
  const description = compactSessionDescription(session.description);
  return `- id=${session.sessionizeId} | ${field}${session.title} | ${minutes} min | ${speakers}${description}`;
}

const PROMPT_HEADER = [
  "Cluster these conference talks into thematic program blocks.",
  "Each block should have at most 3 sessions and total about 80–90 minutes (advisory, not strict).",
  "Use only the session ids provided. Every session listed below must appear in exactly one group.",
  "Prefer thematic fit from title and description.",
  "Prefer grouping sessions with the same Field when thematically similar.",
].join("\n");

export function buildReconciliationPrompt(
  sessions: SuggestionInputSession[],
): string {
  const header = [
    "Place these remaining conference talks into thematic program blocks.",
    "Each block should have at most 3 sessions and total about 80–90 minutes.",
    "Use only the session ids provided. Every session listed must appear in exactly one group.",
    "You may create new groups or add sessions to themes that fit.",
  ].join("\n");
  return [header, "", "Sessions:", ...sessions.map(formatSessionLine)].join(
    "\n",
  );
}

export function buildSuggestionPrompt(sessions: SuggestionInputSession[]): string {
  return [PROMPT_HEADER, "", "Sessions:", ...sessions.map(formatSessionLine)].join(
    "\n",
  );
}

export function buildSuggestionPrompts(
  sessions: SuggestionInputSession[],
  maxSessionsPerPrompt = SESSIONS_PER_PROMPT,
): string[] {
  if (sessions.length === 0) return [];
  const prompts: string[] = [];
  for (let i = 0; i < sessions.length; i += maxSessionsPerPrompt) {
    prompts.push(
      buildSuggestionPrompt(sessions.slice(i, i + maxSessionsPerPrompt)),
    );
  }
  return prompts;
}
