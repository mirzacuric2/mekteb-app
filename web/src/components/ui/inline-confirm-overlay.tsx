import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type InlineConfirmOverlayProps = {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

export function InlineConfirmOverlay({
  open,
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  confirmIcon = <Trash2 size={12} />,
  onConfirm,
  onCancel,
  className,
}: InlineConfirmOverlayProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-white/95 backdrop-blur-[1px]",
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-1 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onConfirm}
        >
          {confirmIcon}
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
