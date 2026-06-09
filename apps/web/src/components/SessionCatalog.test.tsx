import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionCatalog } from "./SessionCatalog";

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
    status: "active",
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
    status: "active",
  },
];

const serviceSession = {
  _id: "3",
  title: "Lunch break",
  description: null,
  field: null,
  lengthMinutes: 30,
  speakerNames: [],
  sessionizeStatus: "Accepted",
  isServiceSession: true,
  status: "active" as const,
};

describe("SessionCatalog", () => {
  it("lists service sessions separately without drag handles", () => {
    const { container } = render(
      <SessionCatalog sessions={[...sessions, serviceSession]} />,
    );
    const catalog = within(container).getByRole("region", {
      name: /session catalog/i,
    });

    expect(within(catalog).getByText("Service sessions")).toBeInTheDocument();
    expect(within(catalog).getByText("Lunch break")).toBeInTheDocument();
    expect(
      within(catalog).getByText(/reference only/i),
    ).toBeInTheDocument();
  });

  it("filters sessions when searching", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionCatalog sessions={sessions} />);
    const catalog = within(container).getByRole("region", {
      name: /session catalog/i,
    });

    await user.type(
      within(catalog).getByLabelText(/search sessions/i),
      "beta",
    );
    expect(
      within(catalog).getByRole("heading", { level: 3, name: "Beta" }),
    ).toBeInTheDocument();
    expect(within(catalog).queryByText("Alpha")).not.toBeInTheDocument();
  });
});
