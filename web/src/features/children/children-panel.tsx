import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE } from "../../types";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useRoleAccess } from "../auth/use-role-access";
import { UserPlus } from "lucide-react";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { LoadingBlock } from "../common/components/loading-block";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { ChildrenTable } from "./children-table";
import { CHILD_STATUS, type ChildRecord } from "./types";
import {
  useChildByIdQuery,
  useChildrenCommunityOptionsQuery,
  useChildrenListQuery,
  useChildrenParentOptionsQuery,
} from "./use-children-data";
import { useCreateChildMutation, useInactivateChildMutation, useUpdateChildMutation } from "./use-children-mutations";
import { ChildFormDialog, ChildParentOption } from "./child-form-dialog";
import { ChildFormValues } from "./child-form-schema";
import { ProgressChildDetailsDrawer } from "../dashboard/progress-child-details-drawer";
import { useAuthedQuery } from "../common/use-authed-query";
import { LESSONS_API_PATH, LESSONS_QUERY_KEY } from "../lessons/constants";
import { Lesson } from "../lessons/types";

type Props = { canManage: boolean };

export function ChildrenPanel({ canManage: _canManage }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const childIdFromQuery = useMemo(() => new URLSearchParams(location.search).get("childId") || undefined, [location.search]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingChild, setDeletingChild] = useState<ChildRecord | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const suppressQueryOpenRef = useRef(false);
  const queryClient = useQueryClient();
  const { canAdminManage, canEditChildren, canInactivate, canChooseCommunity, isParent, isUser, isBoardMember } =
    useRoleAccess();
  const searchTerm = search.trim();
  const mineOnly = isParent || isUser || isBoardMember;
  const children = useChildrenListQuery({
    search: searchTerm,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    mineOnly,
  });
  const childById = useChildByIdQuery(childIdFromQuery, mineOnly);
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

  const totalPages = Math.max(1, Math.ceil((children.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const currentPage = children.data?.page || page;
  const pagedChildren = children.data?.items || [];
  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, Boolean(selectedChild));
  const selectedChildScheduledLessons = useMemo(() => {
    if (!selectedChild) return 0;
    return (lessonsQuery.data || []).filter((lesson) => lesson.nivo === selectedChild.nivo).length;
  }, [lessonsQuery.data, selectedChild]);

  useEffect(() => {
    if (!childIdFromQuery) {
      suppressQueryOpenRef.current = false;
      return;
    }
    if (suppressQueryOpenRef.current) return;
    if (selectedChild?.id === childIdFromQuery) return;
    const targetChild = (children.data?.items || []).find((child) => child.id === childIdFromQuery) || childById.data || null;
    if (!targetChild) return;
    setSelectedChild(targetChild);
  }, [childById.data, childIdFromQuery, children.data?.items, selectedChild?.id]);

  useEffect(() => {
    const selectedChildId = selectedChild?.id;
    if (selectedChildId === childIdFromQuery) return;
    const nextParams = new URLSearchParams(location.search);
    if (selectedChildId) {
      nextParams.set("childId", selectedChildId);
    } else {
      nextParams.delete("childId");
    }
    navigate(
      {
        pathname: location.pathname,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: true }
    );
  }, [childIdFromQuery, location.pathname, location.search, navigate, selectedChild?.id]);

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
        <LoadingBlock text={t("childrenLoading")} containerClassName="min-h-[220px]" />
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
      <ProgressChildDetailsDrawer
        open={!!selectedChild}
        onOpenChange={(open) => {
          if (!open) {
            suppressQueryOpenRef.current = true;
            setSelectedChild(null);
            if (childIdFromQuery) {
              const nextParams = new URLSearchParams(location.search);
              nextParams.delete("childId");
              navigate(
                {
                  pathname: location.pathname,
                  search: nextParams.toString() ? `?${nextParams.toString()}` : "",
                },
                { replace: true }
              );
            }
          }
        }}
        child={selectedChild}
        summary={null}
        scheduledLessons={selectedChildScheduledLessons}
      />
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
