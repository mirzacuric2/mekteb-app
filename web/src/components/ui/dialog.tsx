import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex overflow-y-auto overflow-x-hidden p-3 sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>,
    document.body
  );
}

type DialogContentProps = {
  children: ReactNode;
  className?: string;
};

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <section
      className={cn(
        "relative m-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cn("border-b border-border p-4", className)}>{children}</header>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto p-4", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <footer className={cn("flex justify-end gap-2 border-t border-border p-4", className)}>{children}</footer>;
}
