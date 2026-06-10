import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { DialogProvider } from "../components/dialogs/DialogProvider";
import { ThemeProvider } from "../components/ThemeProvider";
import { SuggestionsPage } from "./SuggestionsPage";

function renderPage() {
  return render(
    <ThemeProvider>
      <DialogProvider>
        <SuggestionsPage />
      </DialogProvider>
    </ThemeProvider>,
  );
}

vi.mock("../access/AccessContext", () => ({
  useAccess: () => ({
    sessionToken: "session-1",
    isAuthenticated: true,
    isLoading: false,
    signOut: vi.fn(),
    redeemToken: vi.fn(),
  }),
}));

const groups = [
  {
    title: "Platform",
    rationale: "Infra talks",
    sessions: [
      {
        sessionizeId: "a",
        title: "Talk A",
        lengthMinutes: 30,
        field: "Dev",
      },
      {
        sessionizeId: "b",
        title: "Talk B",
        lengthMinutes: 45,
        field: "Ops",
      },
    ],
    totalMinutes: 75,
    warnings: [],
  },
];

const report = {
  inputSessionCount: 2,
  groupedSessionCount: 2,
  uncoveredSessions: [],
  duplicateSessionIds: [],
  invalidSessionIds: [],
};

let sessionOnlyCalls = 0;
let pageScopedCalls = 0;

function mockUseQuery(...args: unknown[]) {
  const queryArgs = args[1];
  if (queryArgs === "skip") return undefined;
  if (queryArgs && typeof queryArgs === "object" && "programPageId" in queryArgs) {
    pageScopedCalls += 1;
    return pageScopedCalls % 2 === 1
      ? {
          page: { _id: "page1", name: "Main" },
          blocks: [],
          assignedSessionIds: [],
        }
      : { pageName: "Main", unassigned: [] };
  }
  sessionOnlyCalls += 1;
  if (sessionOnlyCalls === 1) {
    return {
      groups,
      report,
      model: "gpt-4o-mini",
      createdAt: 1,
      scope: "full",
      metadata: { stages: [] },
    };
  }
  if (sessionOnlyCalls === 2) {
    return [{ _id: "page1", name: "Main", sortOrder: 0 }];
  }
  if (sessionOnlyCalls === 3) {
    return [];
  }
  return [];
}

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useAction: () => vi.fn(),
  useMutation: () => vi.fn(),
}));

describe("SuggestionsPage", () => {
  it("lists suggested groups separately from the program editor", () => {
    sessionOnlyCalls = 0;
    pageScopedCalls = 0;
    vi.mocked(useQuery).mockImplementation(mockUseQuery);

    const { container } = renderPage();
    const page = within(container);

    expect(page.getByRole("heading", { level: 1 })).toHaveTextContent(
      /ai suggestions/i,
    );
    expect(page.getByRole("link", { name: /program editor/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(page.getByText("Platform")).toBeInTheDocument();
    expect(page.getByText(/75/)).toBeInTheDocument();
  });

  it("shows confirmation after copying a group", async () => {
    sessionOnlyCalls = 0;
    pageScopedCalls = 0;
    vi.mocked(useQuery).mockImplementation(mockUseQuery);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(
      within(container).getByRole("button", { name: /^copy$/i }),
    );

    await waitFor(() => {
      expect(
        within(container).getByText(/Copied "Platform"/),
      ).toBeInTheDocument();
    });
  });
});
