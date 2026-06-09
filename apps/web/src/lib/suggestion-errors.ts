export function formatSuggestionError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const core =
    raw.match(
      /(?:Uncaught )?(?:Error|AI_RetryError):\s*(.+?)(?:\s+at |\s+Called by client)/,
    )?.[1] ?? raw;

  if (/quota|billing|exceeded your current quota/i.test(core)) {
    return "OpenAI quota exceeded. Add credits or check billing at platform.openai.com, then try again.";
  }
  if (/invalid.*api.*key|incorrect api key/i.test(core)) {
    return "Invalid OpenAI API key. Update OPENAI_API_KEY on your Convex deployment and try again.";
  }
  if (/OPENAI_API_KEY is not configured/i.test(core)) {
    return "OpenAI is not configured. Set OPENAI_API_KEY on your Convex deployment (see README).";
  }
  if (/Import sessions before generating|Accept queue or Accepted/i.test(core)) {
    return core.includes("Accept queue")
      ? "Re-import from Sessionize so Accept-queue sessions are stored, or widen SESSIONIZE_SCHEDULABLE_STATUSES on Convex."
      : "Import sessions from Sessionize on the program editor, then generate suggestions.";
  }
  if (/too large|tokens per min|\bTPM\b/i.test(core)) {
    return "The session catalog is too large for one request. Redeploy the backend and try again.";
  }

  return core.length > 280 ? `${core.slice(0, 277)}…` : core;
}
