import { describe, expect, it } from "vitest";
import {
  buildAdminSessionTabs,
  filterAdminSessionsByTab,
  sessionizeStatusLabel,
} from "./admin-sessions.js";
import type { AdminSession } from "./admin-sessions.js";

const base = (overrides: Partial<AdminSession>): AdminSession => ({
  _id: "1",
  title: "Talk",
  field: "Dev",
  lengthMinutes: 30,
  sessionizeStatus: "Accept_Queue",
  status: "active",
  placementCount: 0,
  ...overrides,
});

describe("admin session tabs", () => {
  it("formats sessionize status labels", () => {
    expect(sessionizeStatusLabel("Accept_Queue")).toBe("Accept Queue");
    expect(sessionizeStatusLabel(null)).toBe("No status");
  });

  it("builds tabs for all, statuses, and removed", () => {
    const tabs = buildAdminSessionTabs([
      base({ _id: "1", sessionizeStatus: "Accept_Queue" }),
      base({ _id: "2", sessionizeStatus: "Nominated", title: "Nominated talk" }),
      base({
        _id: "3",
        status: "removed",
        title: "Old talk",
        sessionizeStatus: "Accepted",
      }),
    ]);

    expect(tabs.map((tab) => tab.label)).toEqual([
      "All",
      "Accept Queue",
      "Nominated",
      "Removed from Sessionize",
    ]);
    expect(tabs[0]?.count).toBe(3);
    expect(tabs[1]?.count).toBe(1);
    expect(tabs[3]?.count).toBe(1);
  });

  it("filters sessions by tab", () => {
    const sessions = [
      base({ _id: "1", sessionizeStatus: "Accept_Queue" }),
      base({ _id: "2", sessionizeStatus: "Nominated" }),
      base({ _id: "3", status: "removed" }),
    ];

    expect(filterAdminSessionsByTab(sessions, "Nominated")).toHaveLength(1);
    expect(filterAdminSessionsByTab(sessions, "__removed__")).toHaveLength(1);
    expect(filterAdminSessionsByTab(sessions, "__all__")).toHaveLength(3);
  });
});
