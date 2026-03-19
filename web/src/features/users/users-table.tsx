import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { NaValue } from "../common/components/na-value";
import { PaginationControls } from "../common/components/pagination-controls";
import { StatusBadge } from "../common/components/status-badge";
import { Loader } from "../common/components/loader";
import { useTranslation } from "react-i18next";
import { Role } from "../../types";
import { UserStatus } from "./user-form-schema";

type UserRole = Role;

export type UserAddressRecord = {
  streetLine1: string;
  streetLine2?: string | null;
  postalCode: string;
  city: string;
  state?: string | null;
  country: string;
};

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  ssn?: string;
  phoneNumber?: string | null;
  address?: UserAddressRecord | null;
  email: string;
  role: UserRole;
  communityId: string | null;
  communityName?: string | null;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  childrenCount?: number;
};

type UsersTableProps = {
  users: UserRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  showCommunityColumn?: boolean;
  canEdit?: boolean;
  onPageChange: (page: number) => void;
  onRowClick: (user: UserRecord) => void;
  onEdit?: (user: UserRecord) => void;
  onDelete?: (user: UserRecord) => void;
};

export function UsersTable({
  users,
  isLoading,
  page,
  totalPages,
  showCommunityColumn = true,
  canEdit = true,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const { t } = useTranslation();
  const tableColSpan = showCommunityColumn ? (canEdit ? 8 : 7) : canEdit ? 7 : 6;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <DataTable
          className="overflow-hidden"
          scrollClassName="overflow-x-auto !overflow-y-hidden"
          tableClassName="w-full min-w-[900px] border-collapse text-sm"
          headers={
            <>
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTableName")}</th>
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTableEmail")}</th>
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTablePhone")}</th>
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTableRole")}</th>
              {showCommunityColumn ? (
                <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">
                  {t("usersTableCommunity")}
                </th>
              ) : null}
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTableChildren")}</th>
              <th className="whitespace-nowrap border-b border-border px-4 py-3.5 font-medium">{t("usersTableStatus")}</th>
              {canEdit ? (
                <th className="w-[140px] whitespace-nowrap border-b border-border px-4 py-3.5 font-medium text-right">
                  <span className="sr-only">{t("usersTableActions")}</span>
                </th>
              ) : null}
            </>
          }
        >
          {users.map((user) => (
            <tr
              key={user.id}
              className="cursor-pointer border-b border-border transition-colors hover:bg-slate-50"
              onClick={() => onRowClick(user)}
            >
              <td className="px-4 py-3.5 font-medium text-slate-900">
                <span className="block truncate" title={`${user.firstName} ${user.lastName}`}>
                  {user.firstName} {user.lastName}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="block truncate" title={user.email}>
                  {user.email}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <NaValue value={user.phoneNumber} />
              </td>
              <td className="px-4 py-3.5">
                <span className="block truncate" title={user.role}>
                  {user.role}
                </span>
              </td>
              {showCommunityColumn ? (
                <td className="px-4 py-3.5">
                  <span className="block truncate" title={user.communityName || ""}>
                    <NaValue value={user.communityName} />
                  </span>
                </td>
              ) : null}
              <td className="whitespace-nowrap px-4 py-3.5">{user.childrenCount || 0}</td>
              <td className="px-4 py-3.5">
                <StatusBadge status={user.status || "INACTIVE"} />
              </td>
              {canEdit ? (
                <td className="w-[140px] whitespace-nowrap px-4 py-3.5 text-right align-middle">
                  <EntityRowActions onEdit={() => onEdit?.(user)} onDelete={() => onDelete?.(user)} />
                </td>
              ) : null}
            </tr>
          ))}
          {isLoading ? (
            <tr>
              <td className="px-4 py-10 text-center text-slate-500" colSpan={tableColSpan}>
                <Loader size="lg" text={t("loadingUsers")} className="justify-center" />
              </td>
            </tr>
          ) : null}
          {!users.length && !isLoading ? (
            <tr>
              <td className="px-4 py-10 text-center text-slate-500" colSpan={tableColSpan}>
                {t("noUsersFound")}
              </td>
            </tr>
          ) : null}
        </DataTable>
      </div>

      <div className="shrink-0 pt-5">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
