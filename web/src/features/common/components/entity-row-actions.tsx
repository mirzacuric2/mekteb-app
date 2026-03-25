import { useCallback, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";

type EntityRowActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function EntityRowActions({ onEdit, onDelete }: EntityRowActionsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 130;
    const menuHeight = 80;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openAbove = spaceBelow < menuHeight && rect.top > spaceBelow;
    setMenuStyle({
      position: "fixed",
      width: menuWidth,
      right: 16,
      ...(openAbove ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, updateMenuPosition]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative flex w-full justify-end gap-1.5">
      <div className="hidden gap-1.5 md:flex">
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 shrink-0 px-0 py-0"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label={t("edit")}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 shrink-0 border-red-200 px-0 py-0 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label={t("delete")}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="md:hidden">
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          aria-label={t("usersTableActions")}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {open ? (
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-[100] rounded-md border border-border bg-white p-1 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil size={14} />
              <span>{t("edit")}</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={14} />
              <span>{t("delete")}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
