import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Edit3, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { PrivateLayoutContext } from "../../layouts/private-layout-context";
import { ROLE, type Role as PlatformRole } from "../../types";
import { useRoleAccess } from "../auth/use-role-access";
import { LoadingBlock } from "../common/components/loading-block";
import { NaValue } from "../common/components/na-value";
import { StatusBadge } from "../common/components/status-badge";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { EntityDetailsDrawer } from "../common/components/entity-details-drawer";
import { ChildProgressDetailInner } from "../dashboard/child-progress-detail-inner";
import { communityDetailPagePath } from "../communities/community-paths";
import { ChildOverviewCharts } from "./child-overview-charts";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
  LESSON_PROGRAM,
} from "../lessons/constants";
import { Lesson } from "../lessons/types";
import { UserDetailsDrawerContent } from "../users/user-details-drawer-content";
import type { UserRecord } from "../users/users-table";
import { childDetailPagePath } from "./child-paths";
import { ChildFormDialog, ChildParentOption } from "./child-form-dialog";
import { ChildFormValues } from "./child-form-schema";
import { CHILD_STATUS, type ChildParent, type ChildRecord } from "./types";
import {
  useChildByIdQuery,
  useChildrenCommunityOptionsQuery,
  useChildrenParentOptionsQuery,
} from "./use-children-data";
import { useInactivateChildMutation, useUpdateChildMutation } from "./use-children-mutations";
import { AxiosError } from "axios";

type Props = {
  selectedChildId: string;
};

function parentToUserRecord(parent: NonNullable<ChildParent["parent"]>): UserRecord {
  return {
    id: parent.id,
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email,
    role: parent.role as PlatformRole,
    communityId: parent.communityId ?? null,
  };
}

export function ChildPage({ selectedChildId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbDetailLabel } = useOutletContext<PrivateLayoutContext>();
  const {
    canAdminManage,
    canEditChildren,
    canInactivate,
    canChooseCommunity,
    isSuperAdmin,
    isParent,
    isUser,
  } = useRoleAccess();
  const mineOnly = isParent || isUser;

  const [formOpen, setFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [deletingChild, setDeletingChild] = useState<ChildRecord | null>(null);
  const [parentDrawerUser, setParentDrawerUser] = useState<UserRecord | null>(null);

  const childQuery = useChildByIdQuery(selectedChildId, mineOnly, Boolean(selectedChildId));
  const child = childQuery.data ?? null;

  const users = useChildrenParentOptionsQuery(canAdminManage);
  const communities = useChildrenCommunityOptionsQuery(canAdminManage);
  const parentOptions: ChildParentOption[] = (users.data || [])
    .filter((user) => user.role !== ROLE.SUPER_ADMIN)
    .map((p) => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`.trim(),
      status: p.status,
      communityId: p.communityId,
    }));

  const communityNameById = useMemo(
    () => new Map((communities.data || []).map((c) => [c.id, c.name] as const)),
    [communities.data]
  );

  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, Boolean(child));
  const scheduledLessons = useMemo(() => {
    if (!child) return 0;
    return (lessonsQuery.data || []).filter(
      (lesson) => lesson.program === LESSON_PROGRAM.ILMIHAL && lesson.nivo === child.nivo
    ).length;
  }, [lessonsQuery.data, child]);

  useEffect(() => {
    if (child) {
      setBreadcrumbDetailLabel(`${child.firstName} ${child.lastName}`);
    }
    return () => setBreadcrumbDetailLabel(null);
  }, [child, setBreadcrumbDetailLabel]);

  useEffect(() => {
    if (!childQuery.isFetched) return;
    if (childQuery.isError || !child) {
      toast.error(t("childPageLoadFailed"));
      navigate("/app/children", { replace: true });
    }
  }, [child, childQuery.isError, childQuery.isFetched, navigate, t]);

  const updateChild = useUpdateChildMutation(editingChild?.id || null);
  const inactivateChild = useInactivateChildMutation();

  const getApiFieldError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string; field?: string } | undefined;
      return { field: data?.field, message: data?.message || fallback };
    }
    return { message: fallback };
  };

  const handleChildFormSubmit = (values: ChildFormValues) => {
    if (!editingChild) return;
    setFormApiError(null);
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
          setFormOpen(false);
          setEditingChild(null);
          setFormApiError(null);
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
  };

  const communityName = child?.communityId ? communityNameById.get(child.communityId) ?? null : null;

  const childrenLinkedToDrawerParent = useMemo(() => {
    if (!child || !parentDrawerUser) return [];
    const linked = (child.parents || []).some((row) => row.parentId === parentDrawerUser.id);
    if (!linked) return [];
    return [{ id: child.id, firstName: child.firstName, lastName: child.lastName, nivo: child.nivo }];
  }, [child, parentDrawerUser]);

  if (childQuery.isLoading || !child) {
    return (
      <Card>
        <LoadingBlock text={t("childrenLoading")} containerClassName="min-h-[220px] border-0" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-slate-900">
              <h2 className="truncate text-lg font-semibold">
                {child.firstName} {child.lastName}
              </h2>
              <StatusBadge status={child.status} />
            </div>
            {isSuperAdmin && child.communityId ? (
              <p className="text-sm text-slate-600">
                {communityName ? (
                  <Link
                    to={communityDetailPagePath(child.communityId)}
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    aria-label={`${t("community")}: ${communityName}`}
                  >
                    <span>{communityName}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium text-slate-700">{t("community")}: </span>
                    <NaValue value={null} />
                  </span>
                )}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {canEditChildren ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-2.5 py-0 text-xs font-medium"
                onClick={() => {
                  setFormApiError(null);
                  setEditingChild(child);
                  setFormOpen(true);
                }}
              >
                <Edit3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t("edit")}</span>
              </Button>
            ) : null}
            {canInactivate && child.status !== CHILD_STATUS.INACTIVE ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 border-red-200 px-2.5 py-0 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => setDeletingChild(child)}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t("delete")}</span>
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4 sm:p-6">
        <ChildOverviewCharts child={child} scheduledIlmihalLessons={scheduledLessons} />
      </Card>

      <Card className="space-y-4">
        <ChildProgressDetailInner
          child={child}
          isLoading={childQuery.isFetching && !child}
          syncTabToSearchParams
          childrenFetchMineOnly={mineOnly}
          queriesEnabled
          showTabIcons
          detailLayout="page"
          onOpenParentProfile={(parentId) => {
            const row = child.parents?.find((r) => r.parentId === parentId);
            const p = row?.parent;
            if (p) setParentDrawerUser(parentToUserRecord(p));
          }}
        />
      </Card>

      <ChildFormDialog
        open={formOpen}
        mode="edit"
        initialValues={{
          firstName: editingChild?.firstName || "",
          lastName: editingChild?.lastName || "",
          ssn: editingChild?.ssn || "",
          birthDate: editingChild?.birthDate
            ? new Date(editingChild.birthDate).toISOString().slice(0, 10)
            : "",
          nivo: editingChild?.nivo || 1,
          communityId: editingChild?.communityId || "",
          parentIds: (editingChild?.parents || []).map((p) => p.parentId),
          streetLine1: editingChild?.address?.streetLine1 || "",
          streetLine2: editingChild?.address?.streetLine2 || "",
          postalCode: editingChild?.address?.postalCode || "",
          city: editingChild?.address?.city || "",
          stateValue: editingChild?.address?.state || "",
          country: editingChild?.address?.country || "",
          programs: (editingChild?.programEnrollments || []).map((e) => e.program),
        }}
        canAdminManage={canAdminManage}
        canChooseCommunity={canChooseCommunity}
        parentOptions={parentOptions}
        communityOptions={communities.data || []}
        apiError={formApiError}
        submitting={updateChild.isPending}
        onSubmit={handleChildFormSubmit}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingChild(null);
            setFormApiError(null);
          }
        }}
      />

      <EntityDetailsDrawer
        open={Boolean(parentDrawerUser)}
        onOpenChange={(open) => {
          if (!open) setParentDrawerUser(null);
        }}
        title={
          parentDrawerUser ? `${parentDrawerUser.firstName} ${parentDrawerUser.lastName}` : t("usersDrawerTitleFallback")
        }
      >
        {parentDrawerUser ? (
          <UserDetailsDrawerContent
            user={parentDrawerUser}
            communityName={
              parentDrawerUser.communityId
                ? communityNameById.get(parentDrawerUser.communityId) || parentDrawerUser.communityId
                : null
            }
            children={childrenLinkedToDrawerParent}
            onOpenChild={(id) => {
              setParentDrawerUser(null);
              navigate(childDetailPagePath(id));
            }}
          />
        ) : null}
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
              navigate("/app/children", { replace: true });
            },
          });
        }}
      />
    </div>
  );
}
