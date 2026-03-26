import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { InlineConfirmOverlay } from "../../components/ui/inline-confirm-overlay";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import { StatusBadge } from "../common/components/status-badge";
import { ChildRecord } from "../children/types";
import { childDetailPagePath } from "../children/child-paths";
import { ChildProgressDetailInner } from "./child-progress-detail-inner";
import {
  CHILD_DRAWER_TAB_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
} from "./child-drawer-tab.constants";

type ProgressChildDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ChildRecord | null;
  isLoading?: boolean;
  childrenFetchMineOnly: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  /** When true, tab state is read/written from URL `tab` (e.g. dashboard `?childId=&tab=`). */
  syncTabToSearchParams?: boolean;
  /** Show link to full `/app/children/:id` page beside the close control. */
  showFullPageLink?: boolean;
};

export function ProgressChildDetailsDrawer({
  open,
  onOpenChange,
  child,
  isLoading = false,
  childrenFetchMineOnly,
  onEdit,
  onDelete,
  deleteLabel,
  syncTabToSearchParams = false,
  showFullPageLink = true,
}: ProgressChildDetailsDrawerProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const hasActions = Boolean(onEdit || onDelete);

  const fullChildPageHref = useMemo(() => {
    if (!child) return "";
    const tabQ = searchParams.get(CHILD_DRAWER_TAB_QUERY_KEY);
    const tabSuffix =
      syncTabToSearchParams && tabQ && tabQ !== DEFAULT_CHILD_DRAWER_TAB
        ? `?${CHILD_DRAWER_TAB_QUERY_KEY}=${encodeURIComponent(tabQ)}`
        : "";
    return `${childDetailPagePath(child.id)}${tabSuffix}`;
  }, [child, searchParams, syncTabToSearchParams]);

  useEffect(() => {
    if (!open) setConfirmingDelete(false);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right" className="max-w-2xl">
        <DrawerHeader className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DrawerTitle className="mb-0 truncate">
                  {child ? `${child.firstName} ${child.lastName}` : t("childrenDetails")}
                </DrawerTitle>
                {child && !hasActions ? (
                  <span className="inline-flex shrink-0 items-center">
                    <StatusBadge status={child.status} />
                  </span>
                ) : null}
                {hasActions ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {onEdit ? (
                      <Button
                        variant="outline"
                        className="h-7 w-7 gap-1 px-0 py-0 text-[11px] font-medium sm:h-7 sm:w-auto sm:px-2"
                        onClick={onEdit}
                      >
                        <Pencil className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
                        <span className="hidden sm:inline">{t("edit")}</span>
                      </Button>
                    ) : null}
                    {onDelete ? (
                      <Button
                        variant="outline"
                        className="h-7 w-7 gap-1 border-red-200 px-0 py-0 text-[11px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 sm:h-7 sm:w-auto sm:px-2"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        <Trash2 className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
                        <span className="hidden sm:inline">{deleteLabel || t("delete")}</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {child && hasActions ? (
                <div className="mt-1">
                  <StatusBadge status={child.status} />
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {child && showFullPageLink ? (
                <Link
                  to={fullChildPageHref}
                  className="inline-flex rounded-md border border-border p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  title={t("progressChildDrawerOpenFullPage")}
                  aria-label={t("progressChildDrawerOpenFullPage")}
                  onClick={() => onOpenChange(false)}
                >
                  <ExternalLink size={14} />
                </Link>
              ) : null}
              <DrawerClose className="shrink-0 rounded-md border border-border p-1.5">
                <X size={14} />
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="relative min-h-0 flex-1 overflow-y-auto p-3 pb-6 sm:p-4 sm:pb-8">
          <InlineConfirmOverlay
            open={confirmingDelete}
            message={
              child ? t("confirmDeleteName", { name: `${child.firstName} ${child.lastName}` }) : ""
            }
            confirmLabel={deleteLabel || t("delete")}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              setConfirmingDelete(false);
              onDelete?.();
            }}
            onCancel={() => setConfirmingDelete(false)}
          />
          <ChildProgressDetailInner
            child={child}
            isLoading={isLoading}
            syncTabToSearchParams={syncTabToSearchParams}
            childrenFetchMineOnly={childrenFetchMineOnly}
            queriesEnabled={open && Boolean(child)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
