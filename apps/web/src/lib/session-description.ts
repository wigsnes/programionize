import { compactSessionDescription } from "@programionize/ai-suggestions";

export function plainSessionDescription(description: string | null): string {
  const text = compactSessionDescription(description, 10_000);
  return text === "(no description)" ? "" : text;
}
