import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { DialogProvider } from "./dialogs/DialogProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AiHelperPanel } from "./AiHelperPanel";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useAction: () => vi.fn(),
  useMutation: () => vi.fn(),
}));

function renderPanel(open = true) {
  vi.mocked(useQuery).mockReturnValue({
    groups: [],
    report: { inputSessionCount: 0, groupedSessionCount: 0 },
    scope: "page_unassigned",
    metadata: { stages: [] },
  });

  return render(
    <ThemeProvider>
      <DialogProvider>
        <AiHelperPanel
          open={open}
          onOpenChange={vi.fn()}
          sessionToken="session-1"
          programPageId={"page1" as never}
          pageName="Main"
          blockCount={2}
          placedCount={3}
          unassignedCount={5}
          workspaceBlocks={[]}
        />
      </DialogProvider>
    </ThemeProvider>,
  );
}

describe("AiHelperPanel", () => {
  it("shows context and quick actions when open", () => {
    renderPanel(true);

    expect(screen.getByRole("heading", { name: /AI Helper/i })).toBeInTheDocument();
    expect(
      screen.getByText(/2 blocks, 3 placed, 5 unassigned in catalog/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /group unassigned on page/i }),
    ).toBeInTheDocument();
  });
});
