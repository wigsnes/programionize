import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RunStageTimeline, scopeLabel } from "./RunStageTimeline";

describe("RunStageTimeline", () => {
  it("renders stage badges with token usage", () => {
    const { container } = render(
      <RunStageTimeline
        stages={[
          {
            name: "preprocessing",
            durationMs: 1500,
            usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          },
        ]}
      />,
    );

    expect(within(container).getByText(/Preprocess/)).toBeInTheDocument();
    expect(within(container).getByText(/1\.5s · 15 tok/)).toBeInTheDocument();
  });
});

describe("scopeLabel", () => {
  it("maps known scopes to readable labels", () => {
    expect(scopeLabel("full")).toBe("Full catalog");
    expect(scopeLabel("page_unassigned")).toBe("Page unassigned");
    expect(scopeLabel("block_review")).toBe("Block review");
  });
});
