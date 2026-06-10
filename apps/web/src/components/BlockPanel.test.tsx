import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "@programionize/backend/convex/_generated/dataModel";
import { BlockPanel, type BlockView } from "./BlockPanel";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

const blockId = "blocks_1" as Id<"blocks">;

function makeBlock(overrides: Partial<BlockView> = {}): BlockView {
  return {
    _id: blockId,
    label: "Block 1",
    sessionCount: 4,
    totalMinutes: 90,
    sessions: [
      session({ _id: "1", lengthMinutes: 45 }),
      session({ _id: "2", title: "B", lengthMinutes: 15 }),
      session({ _id: "3", title: "C", lengthMinutes: 15 }),
      session({ _id: "4", title: "D", lengthMinutes: 15 }),
    ],
    ...overrides,
  };
}

function session(
  overrides: Partial<BlockView["sessions"][number]> = {},
): BlockView["sessions"][number] {
  return {
    _id: "1",
    title: "A",
    description: null,
    field: "Dev",
    language: null,
    lengthMinutes: 45,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    isServiceSession: false,
    status: "active",
    ...overrides,
  };
}

describe("BlockPanel", () => {
  it("shows language on block session cards", () => {
    const { container } = render(
      <BlockPanel
        block={makeBlock({
          sessionCount: 1,
          totalMinutes: 45,
          sessions: [session({ language: "Norwegian" })],
        })}
        activeDragId={null}
        onRename={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(within(container).getByText("Norwegian")).toBeInTheDocument();
  });

  it("shows compact warning indicator when block rules fail", () => {
    const { container } = render(
      <BlockPanel
        block={makeBlock()}
        activeDragId={null}
        onRename={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      within(container).getByLabelText(/1 block warning/i),
    ).toBeInTheDocument();
    expect(within(container).getByText("Warning")).toBeInTheDocument();
  });

  it("shows good status for a valid block", () => {
    const validBlock: BlockView = {
      _id: blockId,
      label: "Block 1",
      sessionCount: 2,
      totalMinutes: 90,
      sessions: [
        session({ _id: "1", title: "Keynote", lengthMinutes: 60 }),
        session({ _id: "2", title: "Talk", lengthMinutes: 30 }),
      ],
    };
    const { container } = render(
      <BlockPanel
        block={validBlock}
        activeDragId={null}
        onRename={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(within(container).getByText("Good")).toBeInTheDocument();
    expect(
      within(container).queryByLabelText(/block warning/i),
    ).toBeNull();
  });

  it("reveals warning details in a popover", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BlockPanel
        block={makeBlock({
          sessionCount: 1,
          totalMinutes: 30,
          sessions: [session({ status: "removed" })],
        })}
        activeDragId={null}
        onRename={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(
      within(container).getByLabelText(/block warning/i),
    );

    expect(document.body).toHaveTextContent(/no longer in the catalog/i);
  });

  it("calls onSelect when the block header is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <BlockPanel
        block={makeBlock({
          sessionCount: 2,
          totalMinutes: 90,
          sessions: [
            session({ _id: "1", lengthMinutes: 60 }),
            session({ _id: "2", lengthMinutes: 30 }),
          ],
        })}
        activeDragId={null}
        onSelect={onSelect}
        onRename={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(within(container).getByRole("heading", { name: "Block 1" }));
    expect(onSelect).toHaveBeenCalledWith(blockId);
  });
});
