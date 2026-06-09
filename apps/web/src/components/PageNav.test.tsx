import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageNav } from "./PageNav";

const pages = [
  { _id: "page-a", name: "Main program" },
  { _id: "page-b", name: "Experiment" },
];

describe("PageNav", () => {
  it("lists pages and switches selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PageNav
        pages={pages}
        selectedPageId="page-a"
        onSelect={onSelect}
        onCreate={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("navigation", { name: /program pages/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Experiment" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Experiment" }));
    expect(onSelect).toHaveBeenCalledWith("page-b");
  });

  it("creates a page from the new page action", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    const { container } = render(
      <PageNav
        pages={pages}
        selectedPageId="page-a"
        onSelect={vi.fn()}
        onCreate={onCreate}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const nav = within(container).getByRole("navigation", {
      name: /program pages/i,
    });
    await user.click(
      within(nav).getByRole("button", { name: "New page" }),
    );
    expect(onCreate).toHaveBeenCalled();
  });
});
