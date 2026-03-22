import { useEffect, useRef, useState } from "react";
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
  const [mobileMenuDirection, setMobileMenuDirection] = useState<"up" | "down">("down");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
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
          className="h-8 w-8 shrink-0 px-0 py-0"
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
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 shrink-0 px-0 py-0"
          aria-label={t("usersTableActions")}
          onClick={(event) => {
            event.stopPropagation();
            if (!open && rootRef.current) {
              const rect = rootRef.current.getBoundingClientRect();
              const estimatedMenuHeight = 96;
              const spaceAbove = rect.top;
              const spaceBelow = window.innerHeight - rect.bottom;
              setMobileMenuDirection(spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove ? "down" : "up");
            }
            setOpen((prev) => !prev);
          }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Button>
        {open ? (
          <div
            className={`absolute right-0 z-30 min-w-[130px] rounded-md border border-border bg-white p-1 shadow-lg ${
              mobileMenuDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
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
