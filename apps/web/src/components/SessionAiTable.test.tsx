import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SessionAiTable } from "./SessionAiTable";
import type { SessionAiRow } from "./SessionAiDrawer";

const rows: SessionAiRow[] = [
  {
    sessionizeId: "s1",
    title: "Platform talk",
    field: "Dev",
    lengthMinutes: 30,
    aiDiscipline: "backend",
    keywords: ["infra"],
    poolId: "backend",
    stage: "grouping",
    blockTitle: "Platform",
    rationale: "Grouped by theme",
    embeddingText: "Platform talk\ninfra",
  },
  {
    sessionizeId: "s2",
    title: "Design talk",
    field: "Design",
    lengthMinutes: 45,
    aiDiscipline: "design",
    keywords: ["ux"],
    poolId: "design",
    stage: "unassigned",
    rationale: undefined,
    embeddingText: "Design talk\nux",
  },
];

describe("SessionAiTable", () => {
  it("filters rows and opens drawer on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionAiTable rows={rows} />);
    const page = within(container);

    await user.type(page.getByLabelText(/filter session ai table/i), "design");
    expect(page.queryByText("Platform talk")).not.toBeInTheDocument();
    expect(page.getByText("Design talk")).toBeInTheDocument();

    await user.click(page.getByText("Design talk"));
    expect(screen.getByText(/Embedding text/i)).toBeInTheDocument();
  });
});
