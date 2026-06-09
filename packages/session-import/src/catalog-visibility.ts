import {
  DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
  isSessionizeSchedulable,
} from "./schedulable-status.js";

export type CatalogVisibilityInput = {
  status: "active" | "removed";
  isServiceSession: boolean;
  sessionizeStatus: string | null | undefined;
  showInCatalog?: boolean;
};

export function effectiveShowInCatalog(
  session: CatalogVisibilityInput,
  allowedStatuses: readonly string[] = DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
): boolean {
  if (session.status === "removed") return false;
  if (session.showInCatalog === true) return true;
  if (session.showInCatalog === false) return false;

  if (session.isServiceSession) return true;
  return isSessionizeSchedulable(
    session.sessionizeStatus ?? "",
    allowedStatuses,
  );
}

export function isHiddenFromCatalog(
  session: CatalogVisibilityInput,
  allowedStatuses: readonly string[] = DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
): boolean {
  return !effectiveShowInCatalog(session, allowedStatuses);
}
