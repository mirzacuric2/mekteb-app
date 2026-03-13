import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { NaValue } from "../common/components/na-value";
import { PaginationControls } from "../common/components/pagination-controls";
import { StatusBadge } from "../common/components/status-badge";
import { useTranslation } from "react-i18next";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

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
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  childrenCount?: number;
};

type UsersTableProps = {
  users: UserRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (user: UserRecord) => void;
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
};

export function UsersTable({
  users,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const { t } = useTranslation();
  const formatAddress = (address?: UserAddressRecord | null) => {
    if (!address) return null;
    const cityLine = `${address.postalCode} ${address.city}`.trim();
    return [address.streetLine1, cityLine, address.country].filter(Boolean).join(", ");
  };

  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto overflow-y-hidden"
        tableClassName="min-w-[1100px] border-collapse text-sm"
        headers={
          <>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableName")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableEmail")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTablePhone")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableAddress")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableRole")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableCommunity")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableChildren")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableStatus")}</th>
            <th className="w-[140px] whitespace-nowrap border-b border-border px-5 py-3.5 font-medium text-right">
              {t("usersTableActions")}
            </th>
          </>
        }
      >
        {users.map((user) => (
          <tr
            key={user.id}
            className="cursor-pointer border-b border-border transition-colors hover:bg-slate-50"
            onClick={() => onRowClick(user)}
          >
            <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{user.email}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <NaValue value={user.phoneNumber} />
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <NaValue value={formatAddress(user.address)} />
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{user.role}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <NaValue value={user.communityName} />
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{user.childrenCount || 0}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <StatusBadge isActive={user.isActive !== false} />
            </td>
            <td className="w-[140px] whitespace-nowrap px-5 py-3.5 text-right align-middle">
              <EntityRowActions onEdit={() => onEdit(user)} onDelete={() => onDelete(user)} />
            </td>
          </tr>
        ))}
        {isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={9}>
              {t("loadingUsers")}
            </td>
          </tr>
        ) : null}
        {!users.length && !isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={9}>
              {t("noUsersFound")}
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
