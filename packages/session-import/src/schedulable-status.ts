/** Sessionize workflow statuses worth scheduling / AI (default). */
export const DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES = [
  "Accept_Queue",
  "Accepted",
] as const;

export function parseSchedulableStatuses(
  env: string | undefined,
): string[] {
  if (!env?.trim()) {
    return [...DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES];
  }
  return env
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean);
}

export function isSessionizeSchedulable(
  sessionizeStatus: string,
  allowed: readonly string[],
): boolean {
  return allowed.includes(sessionizeStatus);
}
