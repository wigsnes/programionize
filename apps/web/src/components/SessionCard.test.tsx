import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionCard } from "./SessionCard";

const baseSession = {
  _id: "1",
  title: "Withdrawn talk",
  description: null,
  field: "Dev",
  lengthMinutes: 30,
  speakerNames: [],
  sessionizeStatus: "Accept_Queue",
  isServiceSession: false,
  status: "active" as const,
};

describe("SessionCard", () => {
  it("shows a service label for non-schedulable service sessions", () => {
    const { container } = render(
      <SessionCard
        session={{ ...baseSession, title: "Lunch", isServiceSession: true }}
      />,
    );

    expect(within(container).getByText("Service")).toBeInTheDocument();
    expect(within(container).getByRole("article")).toHaveClass("opacity-80");
  });

  it("shows a removed label and dimmed styling for removed sessions", () => {
    const { container } = render(
      <SessionCard
        session={{ ...baseSession, status: "removed" }}
      />,
    );

    expect(within(container).getByText("Removed")).toBeInTheDocument();
    expect(within(container).getByRole("article")).toHaveClass("opacity-60");
    // removed uses dashed border
    expect(within(container).getByRole("article")).toHaveClass("border-dashed");
  });

  it("shows a hidden label and dimmed styling for admin-hidden sessions", () => {
    const { container } = render(
      <SessionCard
        session={{ ...baseSession, showInCatalog: false }}
      />,
    );

    expect(within(container).getByText("Hidden")).toBeInTheDocument();
    expect(within(container).getByRole("article")).toHaveClass("opacity-70");
  });
});
