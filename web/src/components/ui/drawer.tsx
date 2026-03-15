import { createContext, useContext, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

type DrawerDirection = "top" | "right" | "bottom" | "left";

type DrawerContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const value = useContext(DrawerContext);
  if (!value) {
    throw new Error("Drawer components must be used inside <Drawer />.");
  }
  return value;
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return <DrawerContext.Provider value={{ open, onOpenChange }}>{children}</DrawerContext.Provider>;
}

type DrawerCloseProps = {
  children: ReactNode;
  className?: string;
};

export function DrawerClose({ children, className }: DrawerCloseProps) {
  const { onOpenChange } = useDrawerContext();
  return (
    <button type="button" className={className} onClick={() => onOpenChange(false)}>
      {children}
    </button>
  );
}

type DrawerContentProps = {
  children: ReactNode;
  direction?: DrawerDirection;
  className?: string;
};

const directionClass: Record<DrawerDirection, string> = {
  top: "inset-x-0 top-0 h-[70vh]",
  right: "inset-y-0 right-0 h-full w-full max-w-xl",
  bottom: "inset-x-0 bottom-0 h-[70vh]",
  left: "inset-y-0 left-0 h-full w-full max-w-xl",
};

const directionTransformClass: Record<DrawerDirection, { open: string; closed: string }> = {
  top: { open: "translate-y-0", closed: "-translate-y-full" },
  right: { open: "translate-x-0", closed: "translate-x-full" },
  bottom: { open: "translate-y-0", closed: "translate-y-full" },
  left: { open: "translate-x-0", closed: "-translate-x-full" },
};

export function DrawerContent({ children, direction = "right", className }: DrawerContentProps) {
  const { open, onOpenChange } = useDrawerContext();

  return createPortal(
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Close drawer"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />
      <section
        className={cn(
          "absolute border-l border-border bg-white shadow-xl transition-transform duration-300 ease-out will-change-transform",
          directionClass[direction],
          open ? directionTransformClass[direction].open : directionTransformClass[direction].closed,
          className
        )}
      >
        {children}
      </section>
    </div>,
    document.body
  );
}

export function DrawerHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cn("border-b border-border p-4", className)}>{children}</header>;
}

export function DrawerTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}

export function DrawerDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-sm text-slate-500", className)}>{children}</p>;
}

export function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <footer className={cn("border-t border-border p-4", className)}>{children}</footer>;
}
