import {
  DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
} from "@programionize/session-import";

export type AdminSession = {
  _id: string;
  title: string;
  field: string | null;
  lengthMinutes: number | null;
  sessionizeStatus: string | null;
  status: "active" | "removed";
  showInCatalog?: boolean;
  placementCount: number;
};

export type AdminSessionTab = {
  id: string;
  label: string;
  count: number;
};

const REMOVED_TAB_ID = "__removed__";
const ALL_TAB_ID = "__all__";
const NO_STATUS_TAB_ID = "__no_status__";

const STATUS_ORDER = [
  ...DEFAULT_SESSIONIZE_SCHEDULABLE_STATUSES,
  "Nominated",
  "Declined",
  "Decline_Queue",
];

export function sessionizeStatusLabel(status: string | null): string {
  if (!status) return "No status";
  return status.replaceAll("_", " ");
}

export function buildAdminSessionTabs(sessions: AdminSession[]): AdminSessionTab[] {
  const active = sessions.filter((session) => session.status === "active");
  const removed = sessions.filter((session) => session.status === "removed");

  const statusCounts = new Map<string, number>();
  for (const session of active) {
    const key = session.sessionizeStatus ?? NO_STATUS_TAB_ID;
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }

  const statusIds = [...statusCounts.keys()].sort((a, b) => {
    const indexA = STATUS_ORDER.indexOf(a as (typeof STATUS_ORDER)[number]);
    const indexB = STATUS_ORDER.indexOf(b as (typeof STATUS_ORDER)[number]);
    const rankA = indexA === -1 ? STATUS_ORDER.length : indexA;
    const rankB = indexB === -1 ? STATUS_ORDER.length : indexB;
    if (rankA !== rankB) return rankA - rankB;
    return sessionizeStatusLabel(
      a === NO_STATUS_TAB_ID ? null : a,
    ).localeCompare(sessionizeStatusLabel(b === NO_STATUS_TAB_ID ? null : b));
  });

  const tabs: AdminSessionTab[] = [
    { id: ALL_TAB_ID, label: "All", count: sessions.length },
  ];

  for (const statusId of statusIds) {
    tabs.push({
      id: statusId,
      label: sessionizeStatusLabel(
        statusId === NO_STATUS_TAB_ID ? null : statusId,
      ),
      count: statusCounts.get(statusId) ?? 0,
    });
  }

  if (removed.length > 0) {
    tabs.push({
      id: REMOVED_TAB_ID,
      label: "Removed from Sessionize",
      count: removed.length,
    });
  }

  return tabs;
}

export function filterAdminSessionsByTab(
  sessions: AdminSession[],
  tabId: string,
): AdminSession[] {
  if (tabId === ALL_TAB_ID) return sessions;
  if (tabId === REMOVED_TAB_ID) {
    return sessions.filter((session) => session.status === "removed");
  }
  if (tabId === NO_STATUS_TAB_ID) {
    return sessions.filter(
      (session) =>
        session.status === "active" && session.sessionizeStatus == null,
    );
  }
  return sessions.filter(
    (session) =>
      session.status === "active" && session.sessionizeStatus === tabId,
  );
}

export function filterAdminSessionsByQuery(
  sessions: AdminSession[],
  query: string,
): AdminSession[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sessions;
  return sessions.filter((session) => {
    const haystack = [
      session.title,
      session.field ?? "",
      session.sessionizeStatus ?? "",
      session.status,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export { ALL_TAB_ID };
