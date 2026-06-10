import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionCard } from "./SessionCard";

const baseSession = {
  _id: "1",
  title: "Withdrawn talk",
  description: null,
  field: "Dev",
  language: null,
  lengthMinutes: 30,
  speakerNames: [],
  sessionizeStatus: "Accept_Queue",
  isServiceSession: false,
  status: "active" as const,
};

describe("SessionCard", () => {
  it("shows a language badge when language is set", () => {
    const { container } = render(
      <SessionCard
        session={{ ...baseSession, language: "Norwegian" }}
      />,
    );

    expect(within(container).getByText("Norwegian")).toBeInTheDocument();
  });

  it("normalizes Norsk to Norwegian in the badge", () => {
    const { container } = render(
      <SessionCard
        session={{ ...baseSession, language: "Norsk" }}
      />,
    );

    expect(within(container).getByText("Norwegian")).toBeInTheDocument();
  });

  it("omits language badge when language is null", () => {
    const { container } = render(
      <SessionCard session={{ ...baseSession, language: null }} />,
    );

    expect(within(container).queryByText("Norwegian")).toBeNull();
    expect(within(container).queryByText("English")).toBeNull();
  });

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

  it("renders stripped plain description when description contains HTML", () => {
    const { container } = render(
      <SessionCard
        session={{
          ...baseSession,
          description: "<b>Deep dive</b> into <p>Kubernetes</p>",
        }}
      />,
    );

    expect(within(container).getByText("Deep dive into Kubernetes")).toBeInTheDocument();
  });

  it("omits description when null or empty", () => {
    const { container: nullContainer } = render(
      <SessionCard session={{ ...baseSession, description: null }} />,
    );
    expect(
      nullContainer.querySelector('[data-slot="hover-card"]'),
    ).toBeNull();

    const { container: emptyContainer } = render(
      <SessionCard session={{ ...baseSession, description: "   " }} />,
    );
    expect(
      emptyContainer.querySelector('[data-slot="hover-card"]'),
    ).toBeNull();
  });
});
