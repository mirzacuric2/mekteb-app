import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { PaginationControls } from "../common/components/pagination-controls";
import { Loader } from "../common/components/loader";
import { Button } from "../../components/ui/button";
import { Pencil } from "lucide-react";
import { NivoProgress } from "./nivo-progress";
import { CHILD_STATUS, type ChildRecord, type ChildStatus } from "./types";

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

function childStatusBadge(status: ChildStatus) {
  if (status === CHILD_STATUS.ACTIVE) {
    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>;
  }
  if (status === CHILD_STATUS.COMPLETED) {
    return <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">Completed</span>;
  }
  if (status === CHILD_STATUS.DISCONTINUED) {
    return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Discontinued</span>;
  }
  return <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">Inactive</span>;
}

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
  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName="w-full min-w-[920px] border-collapse text-sm"
        headers={
          <>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">Name</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">Nivo</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">Parents</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">Status</th>
            <th className="w-[140px] whitespace-nowrap border-b border-border px-5 py-3.5 text-right font-medium">
              <span className="sr-only">Actions</span>
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
                .join(", ") || "N/A"}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{childStatusBadge(child.status)}</td>
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
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              ) : null}
            </td>
          </tr>
        ))}
        {isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
              <Loader size="lg" text="Loading children..." className="justify-center" />
            </td>
          </tr>
        ) : null}
        {!children.length && !isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
              No children found.
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
