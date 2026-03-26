import { Pencil, Trash2, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { InlineConfirmOverlay } from "../../../components/ui/inline-confirm-overlay";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../../../components/ui/drawer";

type EntityDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerSubline?: ReactNode;
  headerMeta?: ReactNode;
  description?: string;
  editLabel?: string;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
};

export function EntityDetailsDrawer({
  open,
  onOpenChange,
  title,
  headerSubline,
  headerMeta,
  description,
  editLabel = "Edit",
  deleteLabel = "Delete",
  deleteConfirmMessage,
  onEdit,
  onDelete,
  children,
}: EntityDetailsDrawerProps) {
  const { t } = useTranslation();
  const hasActions = Boolean(onEdit || onDelete);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) setConfirmingDelete(false);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right" className="max-w-2xl">
        <DrawerHeader className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DrawerTitle className="mb-0 truncate">{title}</DrawerTitle>
                {hasActions ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {onEdit ? (
                      <Button
                        variant="outline"
                        className="h-7 w-7 gap-1 px-0 py-0 text-[11px] font-medium sm:h-7 sm:w-auto sm:px-2"
                        onClick={onEdit}
                      >
                        <Pencil className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
                        <span className="hidden sm:inline">{editLabel}</span>
                      </Button>
                    ) : null}
                    {onDelete ? (
                      <Button
                        variant="outline"
                        className="h-7 w-7 gap-1 border-red-200 px-0 py-0 text-[11px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 sm:h-7 sm:w-auto sm:px-2"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        <Trash2 className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
                        <span className="hidden sm:inline">{deleteLabel}</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {headerMeta ? <div className="mt-1">{headerMeta}</div> : null}
            </div>
            <DrawerClose className="shrink-0 rounded-md border border-border p-1.5">
              <X size={14} />
            </DrawerClose>
          </div>
          {headerSubline ? <div>{headerSubline}</div> : null}
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <InlineConfirmOverlay
            open={confirmingDelete}
            message={deleteConfirmMessage || t("confirmDeleteName", { name: title })}
            confirmLabel={deleteLabel}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              setConfirmingDelete(false);
              onDelete?.();
            }}
            onCancel={() => setConfirmingDelete(false)}
          />
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
