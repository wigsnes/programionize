import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DialogProvider, useConfirm, usePrompt } from "./DialogProvider";

function PromptConsumer() {
  const prompt = usePrompt();
  const [result, setResult] = useState<string | null>("unset");

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const value = await prompt({
            title: "Rename page",
            label: "Page name",
            defaultValue: "Main program",
          });
          setResult(value);
        }}
      >
        Open prompt
      </button>
      <p>Result: {result ?? "null"}</p>
    </div>
  );
}

function ConfirmConsumer() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>("unset");

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const value = await confirm({
            title: "Delete page",
            description: "Blocks on this page will be removed.",
            confirmLabel: "Delete",
            destructive: true,
          });
          setResult(String(value));
        }}
      >
        Open confirm
      </button>
      <p>Result: {result}</p>
    </div>
  );
}

describe("DialogProvider", () => {
  it("resolves prompt with trimmed input on save", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DialogProvider>
        <PromptConsumer />
      </DialogProvider>,
    );
    const view = within(container);

    await user.click(view.getByRole("button", { name: "Open prompt" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Page name")).toHaveValue("Main program");

    await user.clear(screen.getByLabelText("Page name"));
    await user.type(screen.getByLabelText("Page name"), "  Evening  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(view.getByText("Result: Evening")).toBeInTheDocument();
    });
  });

  it("resolves prompt with null on cancel", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DialogProvider>
        <PromptConsumer />
      </DialogProvider>,
    );
    const view = within(container);

    await user.click(view.getByRole("button", { name: "Open prompt" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(view.getByText("Result: null")).toBeInTheDocument();
    });
  });

  it("resolves confirm with true on confirm", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DialogProvider>
        <ConfirmConsumer />
      </DialogProvider>,
    );
    const view = within(container);

    await user.click(view.getByRole("button", { name: "Open confirm" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(view.getByText("Result: true")).toBeInTheDocument();
    });
  });

  it("resolves confirm with false on cancel", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DialogProvider>
        <ConfirmConsumer />
      </DialogProvider>,
    );
    const view = within(container);

    await user.click(view.getByRole("button", { name: "Open confirm" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(view.getByText("Result: false")).toBeInTheDocument();
    });
  });
});
