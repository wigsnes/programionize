import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type ConfirmAlertDialogProps = {
  open: boolean;
  state: ConfirmDialogState | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmAlertDialog({
  open,
  state,
  onConfirm,
  onCancel,
}: ConfirmAlertDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>{state?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={state?.destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {state?.confirmLabel ?? "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
