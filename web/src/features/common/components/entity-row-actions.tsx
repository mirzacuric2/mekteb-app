import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

type EntityRowActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function EntityRowActions({ onEdit, onDelete }: EntityRowActionsProps) {
  const [open, setOpen] = useState(false);
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
    <div ref={rootRef} className="relative flex w-full justify-end gap-2">
      <div className="hidden gap-2 md:flex">
        <Button
          variant="outline"
          className="px-2"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label="Edit"
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="outline"
          className="px-2"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="md:hidden">
        <Button
          variant="outline"
          className="px-2"
          aria-label="More actions"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <MoreHorizontal size={16} />
        </Button>
        {open ? (
          <div
            className="absolute right-0 z-30 mt-1 min-w-[130px] rounded-md border border-border bg-white p-1 shadow-lg"
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
              <span>Edit</span>
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
              <span>Delete</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
