import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE } from "../../types";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { useRoleAccess } from "../auth/use-role-access";
import { useSession } from "../auth/session-context";
import { ListChecks, UserPlus } from "lucide-react";
import {
  ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME,
  ENTITY_LIST_TO_TABLE_STACK_CLASSNAME,
  EntityListToolbar,
  MANAGEMENT_PAGE_CARD_CLASSNAME,
  MANAGEMENT_PAGE_CARD_STACK_CLASSNAME,
} from "../common/components/entity-list-toolbar";
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
import { BulkLessonOutcomeDialog } from "./bulk-lesson-outcome-dialog";
import { useAuthedQuery } from "../common/use-authed-query";
import { LESSONS_API_PATH, LESSONS_QUERY_KEY, LESSON_PROGRAM } from "../lessons/constants";
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
  const [bulkGradingOpen, setBulkGradingOpen] = useState(false);
  const suppressQueryOpenRef = useRef(false);
  const queryClient = useQueryClient();
  const { ready: sessionReady, session } = useSession();
  const {
    isSuperAdmin,
    canAdminManage,
    canSetChildLessonOutcomes,
    canEditChildren,
    canInactivate,
    canChooseCommunity,
    isParent,
    isUser,
  } = useRoleAccess();
  const searchTerm = search.trim();
  const mineOnly = isParent || isUser;
  const childrenListEnabled = sessionReady && Boolean(session);
  const children = useChildrenListQuery({
    search: searchTerm,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    mineOnly,
    enabled: childrenListEnabled,
  });
  const childById = useChildByIdQuery(childIdFromQuery, mineOnly, childrenListEnabled);
  const users = useChildrenParentOptionsQuery(canAdminManage);
  const communities = useChildrenCommunityOptionsQuery(canAdminManage);
  const parentOptions: ChildParentOption[] = (users.data || [])
    .filter((user) => user.role !== ROLE.SUPER_ADMIN)
    .map((parent) => ({
    value: parent.id,
    label: `${parent.firstName} ${parent.lastName}`.trim(),
    status: parent.status,
      communityId: parent.communityId,
    }));
  const communityNameById = useMemo(
    () => new Map((communities.data || []).map((community) => [community.id, community.name] as const)),
    [communities.data]
  );
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
          programs: canAdminManage ? values.programs : undefined,
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
            await queryClient.invalidateQueries({ queryKey: ["children-by-id"] });
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
          programs: values.programs,
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
  const pagedChildren = children.data?.items || [];
  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, Boolean(selectedChild));
  const selectedChildScheduledLessons = useMemo(() => {
    if (!selectedChild) return 0;
    return (lessonsQuery.data || []).filter(
      (lesson) => lesson.program === LESSON_PROGRAM.ILMIHAL && lesson.nivo === selectedChild.nivo
    ).length;
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
    if (!selectedChild) return;
    const fresh = (children.data?.items || []).find((c) => c.id === selectedChild.id);
    if (fresh && fresh !== selectedChild) {
      setSelectedChild(fresh);
    }
  }, [children.data?.items, selectedChild]);

  useEffect(() => {
    const selectedChildId = selectedChild?.id;
    if (selectedChildId === childIdFromQuery) return;
    /** Keep `?childId=` until hydration fills `selectedChild` (deep links / slow fetch). */
    if (!selectedChildId && childIdFromQuery) return;
    const nextParams = new URLSearchParams(location.search);
    if (selectedChildId) {
      nextParams.set("childId", selectedChildId);
      if (selectedChildId !== childIdFromQuery) {
        nextParams.delete("tab");
      }
    } else {
      nextParams.delete("childId");
      nextParams.delete("tab");
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
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, MANAGEMENT_PAGE_CARD_STACK_CLASSNAME, "overflow-x-hidden")}>
      <div className={ENTITY_LIST_TO_TABLE_STACK_CLASSNAME}>
        <EntityListToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch((prev) => {
              if (prev !== value) setPage(1);
              return value;
            });
          }}
          placeholder={t("childrenSearchPlaceholder")}
          actions={
            canAdminManage || canSetChildLessonOutcomes ? (
              <div className="flex flex-wrap items-center gap-2">
                {canSetChildLessonOutcomes ? (
                  <Button
                    variant="outline"
                    className={ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME}
                    title={t("bulkLessonOutcomeToolbarHint")}
                    onClick={() => setBulkGradingOpen(true)}
                  >
                    <ListChecks className={ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME} aria-hidden />
                    <span className={ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME}>{t("bulkLessonOutcomeToolbar")}</span>
                  </Button>
                ) : null}
                {canAdminManage ? (
                  <Button
                    variant="outline"
                    className={ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME}
                    onClick={() => {
                      resetForm();
                      setFormOpen(true);
                    }}
                  >
                    <UserPlus className={ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME} aria-hidden />
                    <span className={ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME}>{t("childrenCreate")}</span>
                  </Button>
                ) : null}
              </div>
            ) : undefined
          }
        />
        {!childrenListEnabled || children.isLoading ? (
          <LoadingBlock text={t("childrenLoading")} containerClassName="min-h-[220px]" />
        ) : (
          <ChildrenTable
            children={pagedChildren}
            isLoading={children.isLoading}
            page={page}
            totalPages={totalPages}
            totalItems={children.data?.total}
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
            showCommunityColumn={isSuperAdmin}
            resolveCommunityName={(communityId) => communityNameById.get(communityId) || null}
          />
        )}
      </div>

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
                programs: (editingChild.programEnrollments || []).map((entry) => entry.program),
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
      <BulkLessonOutcomeDialog open={bulkGradingOpen} onOpenChange={setBulkGradingOpen} />
      <ProgressChildDetailsDrawer
        open={!!selectedChild}
        onOpenChange={(open) => {
          if (!open) {
            suppressQueryOpenRef.current = true;
            setSelectedChild(null);
            if (childIdFromQuery) {
              const nextParams = new URLSearchParams(location.search);
              nextParams.delete("childId");
              nextParams.delete("tab");
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
        childrenFetchMineOnly={mineOnly}
        onEdit={
          canEditChildren && selectedChild
            ? () => {
                setFormApiError(null);
                setEditingId(selectedChild.id);
                setEditingChild(selectedChild);
                setFormOpen(true);
              }
            : undefined
        }
        onDelete={
          canInactivate && selectedChild && selectedChild.status !== CHILD_STATUS.INACTIVE
            ? () => {
                inactivateChild.mutate(selectedChild.id, {
                  onSuccess: async () => {
                    await queryClient.invalidateQueries({ queryKey: ["children"] });
                    setSelectedChild(null);
                  },
                });
              }
            : undefined
        }
        deleteLabel={t("delete")}
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
              setSelectedChild(null);
            },
          });
        }}
      />
    </Card>
  );
}
