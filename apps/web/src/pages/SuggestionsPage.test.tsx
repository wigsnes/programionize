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
      { sessionizeId: "a", title: "Talk A", lengthMinutes: 30 },
      { sessionizeId: "b", title: "Talk B", lengthMinutes: 45 },
    ],
    totalMinutes: 75,
  },
];

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useAction: () => vi.fn(),
  useMutation: () => vi.fn(),
}));

describe("SuggestionsPage", () => {
  it("lists suggested groups separately from the program editor", () => {
    vi.mocked(useQuery).mockReturnValue({ groups, createdAt: 1 });

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
    vi.mocked(useQuery).mockReturnValue({ groups, createdAt: 1 });
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
