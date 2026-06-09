import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { DialogProvider } from "./components/dialogs/DialogProvider";
import { ThemeProvider } from "./components/ThemeProvider";

vi.mock("./access/AccessContext", () => ({
  useAccess: () => ({
    sessionToken: "session-1",
    isAuthenticated: true,
    isLoading: false,
    signOut: vi.fn(),
    redeemToken: vi.fn(),
  }),
}));

const sessions = [
  {
    _id: "1",
    title: "Beta",
    description: null,
    field: "Dev",
    lengthMinutes: 45,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    isServiceSession: false,
    status: "active" as const,
  },
  {
    _id: "2",
    title: "Alpha",
    description: null,
    field: "Ops",
    lengthMinutes: 15,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    isServiceSession: false,
    status: "active" as const,
  },
];

const workspace = {
  page: { _id: "page1", name: "Main program" },
  blocks: [],
  assignedSessionIds: [],
};

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}));

vi.mock("./components/ProgramWorkspace", () => ({
  ProgramWorkspace: ({ catalogSessions }: { catalogSessions: { title: string }[] }) => (
    <div data-testid="workspace">
      {catalogSessions.map((s) => (
        <span key={s.title}>{s.title}</span>
      ))}
    </div>
  ),
}));

describe("App", () => {
  it("passes unassigned sessions to the workspace", () => {
    const pages = [{ _id: "page1", name: "Main program", sortOrder: 0 }];
    let sessionOnlyCalls = 0;

    vi.mocked(useQuery).mockImplementation((_query, args) => {
      if (args === "skip") return undefined;
      if (
        typeof args === "object" &&
        args !== null &&
        "programPageId" in args
      ) {
        return workspace;
      }
      sessionOnlyCalls += 1;
      return sessionOnlyCalls % 2 === 1 ? pages : sessions;
    });

    render(
      <ThemeProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </ThemeProvider>,
    );
    const workspaceEl = screen.getByTestId("workspace");
    expect(workspaceEl).toHaveTextContent("Alpha");
    expect(workspaceEl).toHaveTextContent("Beta");
  });
});
