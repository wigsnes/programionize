import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PromptDialogState = {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
};

type PromptDialogProps = {
  open: boolean;
  state: PromptDialogState | null;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function PromptDialog({
  open,
  state,
  value,
  onValueChange,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [open, state?.defaultValue]);

  const canSubmit = value.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{state?.title}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>{state?.label}</Label>
            <Input
              ref={inputRef}
              id={inputId}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {state?.confirmLabel ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
