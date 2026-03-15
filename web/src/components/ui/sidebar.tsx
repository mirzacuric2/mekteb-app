import { ButtonHTMLAttributes, createContext, useContext, useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  openMobile: boolean;
  isMobile: boolean;
  setOpen: (value: boolean) => void;
  setOpenMobile: (value: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider({ children, defaultOpen = true, open: openProp, onOpenChange }: SidebarProviderProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  const resolvedOpen = openProp ?? openState;

  const setOpenResolved = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (openProp === undefined) setOpenState(value);
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (!event.matches) setOpenMobile(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== SIDEBAR_KEYBOARD_SHORTCUT) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (isMobile) {
        setOpenMobile((value) => !value);
        return;
      }
      setOpenResolved(!resolvedOpen);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, resolvedOpen]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: resolvedOpen ? "expanded" : "collapsed",
      open: resolvedOpen,
      openMobile,
      isMobile,
      setOpen: setOpenResolved,
      setOpenMobile,
      toggleSidebar: () => {
        if (isMobile) {
          setOpenMobile((value) => !value);
          return;
        }
        setOpenResolved(!resolvedOpen);
      },
    }),
    [isMobile, openMobile, resolvedOpen]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div className="group/sidebar-wrapper h-full w-full min-w-0 max-w-full overflow-hidden">{children}</div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const value = useContext(SidebarContext);
  if (!value) throw new Error("useSidebar must be used within SidebarProvider");
  return value;
}

type SidebarProps = {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

export function Sidebar({
  children,
  className,
  side = "left",
  variant = "floating",
  collapsible = "icon",
}: SidebarProps) {
  const { open, openMobile, isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const desktopWidthClass =
    collapsible === "none" ? "md:w-60" : collapsible === "offcanvas" ? (open ? "md:w-60" : "md:w-0 md:overflow-hidden md:border-transparent md:p-0") : isCollapsed ? "md:w-20" : "md:w-60";

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-40 bg-slate-900/40 transition-opacity md:hidden",
          openMobile ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpenMobile(false)}
      />
      <aside
        data-side={side}
        data-state={state}
        data-collapsible={collapsible}
        data-variant={variant}
        className={cn(
          "absolute inset-y-0 left-0 z-50 flex h-full flex-col overflow-hidden border-r border-border bg-white px-4 pb-4 pt-0 transition-[transform,width] duration-200 md:sticky md:top-6 md:h-[calc(100vh-3rem)]",
          variant === "floating" || variant === "inset" ? "md:rounded-xl md:border" : "",
          isMobile ? (openMobile ? "translate-x-0 w-72" : "-translate-x-full w-72") : "translate-x-0",
          side === "right" ? "left-auto right-0" : "left-0",
          desktopWidthClass,
          className
        )}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarInset({ className, children }: { className?: string; children: React.ReactNode }) {
  return <main className={cn("min-w-0 flex-1 space-y-4", className)}>{children}</main>;
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 shrink-0">{children}</div>;
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">{children}</div>;
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto shrink-0 border-t border-border pt-4">{children}</div>;
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  return (
    <p className={cn("px-2 text-xs font-medium uppercase tracking-wide text-slate-500", !open && !isMobile && "hidden")}>
      {children}
    </p>
  );
}

type SidebarMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ children, className, isActive, ...props }: SidebarMenuButtonProps) {
  const { open, isMobile } = useSidebar();
  return (
    <button
      className={cn(
        "inline-flex h-9 w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-100 text-slate-900"
          : "text-slate-700 hover:bg-slate-100",
        !open && !isMobile ? "justify-center px-2" : "justify-start",
        className
      )}
      {...props}
    >
      {!open && !isMobile && typeof children === "string" ? children.charAt(0) : children}
    </button>
  );
}

export function SidebarTrigger({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md border border-border bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) toggleSidebar();
      }}
    />
  );
}

export function SidebarRail({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      {...props}
      aria-label="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 -right-3 hidden w-6 rounded-md border border-border bg-white text-xs text-slate-600 shadow-sm transition-colors hover:bg-slate-50 md:block",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) toggleSidebar();
      }}
    >
      ||
    </button>
  );
}
