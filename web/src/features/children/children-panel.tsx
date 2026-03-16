import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ROLE } from "../../types";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useRoleAccess } from "../auth/use-role-access";
import { UserPlus } from "lucide-react";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { Loader } from "../common/components/loader";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { EntityDetailsDrawer } from "../common/components/entity-details-drawer";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { ChildrenTable } from "./children-table";
import { ChildDetailsDrawerContent } from "./child-details-drawer-content";
import { CHILD_STATUS, CHILD_STATUS_LABEL, type ChildRecord } from "./types";
import {
  useChildrenCommunityOptionsQuery,
  useChildrenListQuery,
  useChildrenParentOptionsQuery,
} from "./use-children-data";
import { useCreateChildMutation, useInactivateChildMutation, useUpdateChildMutation } from "./use-children-mutations";
import { ChildFormDialog, ChildParentOption } from "./child-form-dialog";
import { ChildFormValues } from "./child-form-schema";

type Props = { canManage: boolean };

export function ChildrenPanel({ canManage: _canManage }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingChild, setDeletingChild] = useState<ChildRecord | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { canAdminManage, canEditChildren, canInactivate, canChooseCommunity } = useRoleAccess();
  const searchTerm = search.trim();
  const children = useChildrenListQuery({
    search: searchTerm,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const users = useChildrenParentOptionsQuery(canAdminManage);
  const communities = useChildrenCommunityOptionsQuery(canChooseCommunity);
  const parentOptions: ChildParentOption[] = (users.data || [])
    .filter((user) => user.role !== ROLE.SUPER_ADMIN)
    .map((parent) => ({
    value: parent.id,
    label: `${parent.firstName} ${parent.lastName}`.trim(),
    status: parent.status,
      communityId: parent.communityId,
    }));
  const getApiFieldError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string; field?: string } | undefined;
      return { field: data?.field, message: data?.message || fallback };
    }
    return { message: fallback };
  };
  const resetForm = () => {
    setEditingId(null);
    setEditingChild(null);
    setFormApiError(null);
  };

  const createChild = useCreateChildMutation();
  const updateChild = useUpdateChildMutation(editingId);
  const inactivateChild = useInactivateChildMutation();

  const handleChildFormSubmit = (values: ChildFormValues) => {
    setFormApiError(null);

    if (editingId) {
      updateChild.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          ssn: values.ssn.trim(),
          birthDate: values.birthDate,
          nivo: canAdminManage ? values.nivo : undefined,
          communityId: canAdminManage && canChooseCommunity ? values.communityId || undefined : undefined,
          parentIds: canAdminManage ? values.parentIds : undefined,
          address:
            values.streetLine1.trim() && values.postalCode.trim() && values.city.trim() && values.country.trim()
              ? {
                  streetLine1: values.streetLine1.trim(),
                  streetLine2: values.streetLine2.trim() || undefined,
                  postalCode: values.postalCode.trim(),
                  city: values.city.trim(),
                  state: values.stateValue.trim() || undefined,
                  country: values.country.trim(),
                }
              : null,
        },
        {
          onSuccess: async () => {
            resetForm();
            setFormOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["children"] });
            toast.success(t("childrenUpdated"));
          },
          onError: (error) => {
            const apiFieldError = getApiFieldError(error, t("childrenUpdateFailed"));
            setFormApiError(apiFieldError);
            toast.error(apiFieldError.message);
          },
        }
      );
      return;
    }
    if (canAdminManage) {
      createChild.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          ssn: values.ssn.trim(),
          birthDate: values.birthDate,
          nivo: values.nivo,
          communityId: canChooseCommunity ? values.communityId || undefined : undefined,
          parentIds: values.parentIds,
          address:
            values.streetLine1.trim() && values.postalCode.trim() && values.city.trim() && values.country.trim()
              ? {
                  streetLine1: values.streetLine1.trim(),
                  streetLine2: values.streetLine2.trim() || undefined,
                  postalCode: values.postalCode.trim(),
                  city: values.city.trim(),
                  state: values.stateValue.trim() || undefined,
                  country: values.country.trim(),
                }
              : undefined,
        },
        {
          onSuccess: async () => {
            resetForm();
            setFormOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["children"] });
            toast.success(t("childrenCreated"));
          },
          onError: (error) => {
            const apiFieldError = getApiFieldError(error, t("childrenCreateFailed"));
            setFormApiError(apiFieldError);
            toast.error(apiFieldError.message);
          },
        }
      );
    }
  };

  const statusLabel = CHILD_STATUS_LABEL;
  const totalPages = Math.max(1, Math.ceil((children.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const currentPage = children.data?.page || page;
  const pagedChildren = children.data?.items || [];

  return (
    <Card className="min-w-0 space-y-4 overflow-x-hidden">
      <EntityListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder={t("childrenSearchPlaceholder")}
        actions={
          canAdminManage ? (
            <Button
              className="h-10 w-10 px-0 md:w-auto md:px-3 md:gap-2"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">{t("childrenCreate")}</span>
            </Button>
          ) : undefined
        }
      />
      {children.isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-border">
          <Loader size="md" />
        </div>
      ) : (
        <ChildrenTable
          children={pagedChildren}
          isLoading={children.isLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(child) => setSelectedChild(child)}
          onEdit={(child) => {
            setFormApiError(null);
            setEditingId(child.id);
            setEditingChild(child);
            setFormOpen(true);
          }}
          onDelete={(child) => {
            if (canInactivate && child.status !== CHILD_STATUS.INACTIVE) {
              setDeletingChild(child);
            }
          }}
          canEdit={canEditChildren}
          canDelete={canInactivate}
        />
      )}

      <ChildFormDialog
        open={formOpen}
        mode={editingId ? "edit" : "create"}
        initialValues={
          editingChild
            ? {
                firstName: editingChild.firstName,
                lastName: editingChild.lastName,
                ssn: editingChild.ssn || "",
                birthDate: new Date(editingChild.birthDate).toISOString().slice(0, 10),
                nivo: editingChild.nivo,
                communityId: editingChild.communityId || "",
                parentIds: (editingChild.parents || []).map((parent) => parent.parentId),
                streetLine1: editingChild.address?.streetLine1 || "",
                streetLine2: editingChild.address?.streetLine2 || "",
                postalCode: editingChild.address?.postalCode || "",
                city: editingChild.address?.city || "",
                stateValue: editingChild.address?.state || "",
                country: editingChild.address?.country || "",
              }
            : undefined
        }
        canAdminManage={canAdminManage}
        canChooseCommunity={canChooseCommunity}
        parentOptions={parentOptions}
        communityOptions={communities.data || []}
        apiError={formApiError}
        submitting={createChild.isPending || updateChild.isPending}
        onSubmit={handleChildFormSubmit}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setFormApiError(null);
            resetForm();
          }
        }}
      />
      <EntityDetailsDrawer
        open={!!selectedChild}
        onOpenChange={(open) => {
          if (!open) setSelectedChild(null);
        }}
        title={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : t("childrenDetails")}
        headerMeta={
          selectedChild ? (
            <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
              {t(statusLabel[selectedChild.status])}
            </span>
          ) : undefined
        }
        description={t("childrenDetails")}
      >
        {selectedChild ? <ChildDetailsDrawerContent child={selectedChild} /> : null}
      </EntityDetailsDrawer>
      <DeleteConfirmDialog
        open={!!deletingChild}
        onOpenChange={(open) => {
          if (!open) setDeletingChild(null);
        }}
        title={t("childrenInactivateTitle")}
        description={
          deletingChild
            ? t("childrenInactivateDescription", { name: `${deletingChild.firstName} ${deletingChild.lastName}` })
            : t("childrenInactivateDescriptionFallback")
        }
        confirmText={t("childrenSetInactive")}
        submitting={inactivateChild.isPending}
        onConfirm={() => {
          if (!deletingChild) return;
          inactivateChild.mutate(deletingChild.id, {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: ["children"] });
              setDeletingChild(null);
            },
          });
        }}
      />
    </Card>
  );
}
