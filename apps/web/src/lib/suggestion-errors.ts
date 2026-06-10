import { formatSuggestionErrorMessage } from "@programionize/ai-suggestions";

export function formatSuggestionError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return formatSuggestionErrorMessage(raw);
}
