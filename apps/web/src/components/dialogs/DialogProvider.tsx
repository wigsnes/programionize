import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConfirmAlertDialog, type ConfirmDialogState } from "./ConfirmAlertDialog";
import { PromptDialog, type PromptDialogState } from "./PromptDialog";

export type PromptOptions = {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
};

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type DialogContextValue = {
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [promptState, setPromptState] = useState<PromptDialogState | null>(
    null,
  );
  const [promptValue, setPromptValue] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(
    null,
  );

  const promptResolveRef = useRef<((value: string | null) => void) | null>(
    null,
  );
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const closePrompt = useCallback((value: string | null) => {
    promptResolveRef.current?.(value);
    promptResolveRef.current = null;
    setPromptState(null);
    setPromptValue("");
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    confirmResolveRef.current?.(value);
    confirmResolveRef.current = null;
    setConfirmState(null);
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      promptResolveRef.current = resolve;
      setPromptState(options);
      setPromptValue(options.defaultValue ?? "");
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState(options);
    });
  }, []);

  const value = useMemo(() => ({ prompt, confirm }), [prompt, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <PromptDialog
        open={promptState !== null}
        state={promptState}
        value={promptValue}
        onValueChange={setPromptValue}
        onSubmit={() => closePrompt(promptValue.trim())}
        onCancel={() => closePrompt(null)}
      />
      <ConfirmAlertDialog
        open={confirmState !== null}
        state={confirmState}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
    </DialogContext.Provider>
  );
}

export function usePrompt() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("usePrompt must be used within DialogProvider");
  }
  return context.prompt;
}

export function useConfirm() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within DialogProvider");
  }
  return context.confirm;
}
