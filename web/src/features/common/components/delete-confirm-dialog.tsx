import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Loader } from "./loader";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  submitting?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm delete",
  description = "Are you sure you want to delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
  submitting = false,
}: DeleteConfirmDialogProps) {
  const [submitLocked, setSubmitLocked] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitLocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (!submitting) {
      setSubmitLocked(false);
    }
  }, [submitting]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!submitting ? onOpenChange(nextOpen) : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-600" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-slate-600">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            <X className="mr-1 h-4 w-4" />
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={submitting || submitLocked}
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              setSubmitLocked(true);
              onConfirm();
            }}
          >
            {submitting ? <Loader size="sm" text="" className="text-white" /> : null}
            {!submitting ? <Trash2 className="h-4 w-4" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
