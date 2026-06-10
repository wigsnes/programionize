import { render, within } from "@testing-library/react";
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
    language: "Norwegian",
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
    language: "English",
    lengthMinutes: 15,
    speakerNames: [],
    sessionizeStatus: "Accept_Queue",
    isServiceSession: false,
    status: "active" as const,
  },
];

const serviceSession = {
  _id: "3",
  title: "Lunch break",
  description: null,
  field: null,
  language: null,
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

  it("filters sessions by field pill", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionCatalog sessions={sessions} />);
    const catalog = within(container).getByRole("region", {
      name: /session catalog/i,
    });

    await user.click(within(catalog).getByRole("button", { name: "Ops" }));
    expect(within(catalog).getByText("Alpha")).toBeInTheDocument();
    expect(within(catalog).queryByText("Beta")).not.toBeInTheDocument();
  });

  it("filters sessions by length pill", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionCatalog sessions={sessions} />);
    const catalog = within(container).getByRole("region", {
      name: /session catalog/i,
    });

    await user.click(within(catalog).getByRole("button", { name: "45 min" }));
    expect(within(catalog).getByText("Beta")).toBeInTheDocument();
    expect(within(catalog).queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("filters sessions that fit the selected block", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SessionCatalog
        sessions={sessions}
        selectedBlock={{ sessionCount: 2, totalMinutes: 75 }}
        selectedBlockLabel="Morning"
      />,
    );
    const catalog = within(container).getByRole("region", {
      name: /session catalog/i,
    });

    await user.click(
      within(catalog).getByLabelText(/only show sessions that fit/i),
    );

    expect(within(catalog).getByText("Alpha")).toBeInTheDocument();
    expect(within(catalog).queryByText("Beta")).not.toBeInTheDocument();
  });
});
