import { DataTable, DATA_TABLE_BODY_DENSITY } from "../common/components/data-table";
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
  totalItems?: number;
  onPageChange: (page: number) => void;
  onRowClick: (child: ChildRecord) => void;
  onEdit: (child: ChildRecord) => void;
  onDelete: (child: ChildRecord) => void;
  canEdit: boolean;
  canDelete: boolean;
  showCommunityColumn: boolean;
  resolveCommunityName: (communityId: string) => string | null;
};

export function ChildrenTable({
  children,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  showCommunityColumn,
  resolveCommunityName,
}: ChildrenTableProps) {
  const { t } = useTranslation();
  const actionColumnWidth = "140px";
  const emptyRowColSpan = showCommunityColumn ? 6 : 5;
  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName={`w-full ${showCommunityColumn ? "min-w-[1060px]" : "min-w-[920px]"} table-fixed border-collapse text-sm`}
        colgroup={
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "9rem" }} />
            {showCommunityColumn ? <col style={{ width: "18%" }} /> : null}
            <col />
            <col style={{ width: actionColumnWidth }} />
          </colgroup>
        }
        bodyDensity={DATA_TABLE_BODY_DENSITY.SPACIOUS}
        headers={
          <>
            <th className="min-w-0">{t("usersTableName")}</th>
            <th>{t("childrenNivoLabel")}</th>
            <th className="whitespace-nowrap">{t("status")}</th>
            {showCommunityColumn ? <th className="min-w-0">{t("community")}</th> : null}
            <th className="min-w-0">{t("childrenParentsLabel")}</th>
            <th className="!text-right">
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
            <td className="min-w-0 whitespace-nowrap font-medium text-slate-900">
              <span className="block truncate" title={`${child.firstName} ${child.lastName}`}>
                {child.firstName} {child.lastName}
              </span>
            </td>
            <td className="whitespace-nowrap">
              <NivoProgress nivo={child.nivo} showIndexLabel />
            </td>
            <td className="whitespace-nowrap">
              <StatusBadge status={child.status} />
            </td>
            {showCommunityColumn ? (
              <td className="min-w-0 break-words text-slate-700">{resolveCommunityName(child.communityId) || t("na")}</td>
            ) : null}
            <td className="min-w-0 break-words text-slate-700">
              {(child.parents || [])
                .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
                .filter(Boolean)
                .join(", ") || t("na")}
            </td>
            <td className="whitespace-nowrap !text-right">
              {canEdit && canDelete ? (
                <EntityRowActions onEdit={() => onEdit(child)} onDelete={() => onDelete(child)} />
              ) : canEdit ? (
                <div className="flex w-full justify-end">
                  <Button
                    type="button"
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
          <TableLoadingRow colSpan={emptyRowColSpan} text={t("childrenLoading")} />
        ) : null}
        {!children.length && !isLoading ? (
          <tr>
            <td className="!py-10 !text-center text-slate-500" colSpan={emptyRowColSpan}>
              {t("childrenNoResults")}
            </td>
          </tr>
        ) : null}
      </DataTable>

      <div className="pt-4">
        <PaginationControls page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={onPageChange} />
      </div>
    </>
  );
}
