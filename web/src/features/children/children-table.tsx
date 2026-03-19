import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { PaginationControls } from "../common/components/pagination-controls";
import { StatusBadge } from "../common/components/status-badge";
import { TableLoadingRow } from "../common/components/table-loading-row";
import { Button } from "../../components/ui/button";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NivoProgress } from "./nivo-progress";
import { type ChildRecord } from "./types";

type ChildrenTableProps = {
  children: ChildRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (child: ChildRecord) => void;
  onEdit: (child: ChildRecord) => void;
  onDelete: (child: ChildRecord) => void;
  canEdit: boolean;
  canDelete: boolean;
};

export function ChildrenTable({
  children,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ChildrenTableProps) {
  const { t } = useTranslation();
  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName="w-full min-w-[920px] border-collapse text-sm"
        headers={
          <>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableName")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("childrenNivoLabel")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("childrenParentsLabel")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("status")}</th>
            <th className="w-[140px] whitespace-nowrap border-b border-border px-5 py-3.5 text-right font-medium">
              <span className="sr-only">{t("usersTableActions")}</span>
            </th>
          </>
        }
      >
        {children.map((child) => (
          <tr
            key={child.id}
            className="cursor-pointer border-b border-border transition-colors hover:bg-slate-50"
            onClick={() => onRowClick(child)}
          >
            <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
              {child.firstName} {child.lastName}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <NivoProgress nivo={child.nivo} showIndexLabel />
            </td>
            <td className="px-5 py-3.5 text-slate-700">
              {(child.parents || [])
                .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
                .filter(Boolean)
                .join(", ") || t("na")}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <StatusBadge status={child.status} />
            </td>
            <td className="w-[140px] whitespace-nowrap px-5 py-3.5 text-right align-middle">
              {canEdit && canDelete ? (
                <EntityRowActions
                  onEdit={() => onEdit(child)}
                  onDelete={() => onDelete(child)}
                />
              ) : canEdit ? (
                <div className="flex w-full justify-end">
                  <Button
                    variant="outline"
                    className="px-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(child);
                    }}
                    aria-label={t("edit")}
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              ) : null}
            </td>
          </tr>
        ))}
        {isLoading ? (
          <TableLoadingRow colSpan={5} text={t("childrenLoading")} />
        ) : null}
        {!children.length && !isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
              {t("childrenNoResults")}
            </td>
          </tr>
        ) : null}
      </DataTable>

      <div className="shrink-0 pt-5">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}
