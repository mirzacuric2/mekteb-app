import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { api } from "../../api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { useSession } from "../auth/session-context";
import { useRoleAccess } from "../auth/use-role-access";
import { useAuthedQuery } from "../common/use-authed-query";
import { ChildFormDialog, ChildParentOption } from "../children/child-form-dialog";
import { ChildFormValues } from "../children/child-form-schema";
import { useChildrenCommunityOptionsQuery, useChildrenParentOptionsQuery } from "../children/use-children-data";
import { useCreateChildMutation, useUpdateChildMutation } from "../children/use-children-mutations";
import {
  CHILD_DRAWER_TAB_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
  isChildDrawerTab,
} from "../dashboard/child-drawer-tab.constants";
import { childDetailPagePath } from "../children/child-paths";
import { EntityDetailsDrawer } from "../common/components/entity-details-drawer";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import {
  ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME,
  EntityListToolbar,
  MANAGEMENT_PAGE_CARD_CLASSNAME,
} from "../common/components/entity-list-toolbar";
import { Role } from "../common/role";
import { StatusBadge } from "../common/components/status-badge";
import { CommunityOption, LinkableChildOption, UserFormDialog } from "../users/user-form-dialog";
import { UserDetailsDrawerContent } from "./user-details-drawer-content";
import { UserRecord, UsersTable } from "./users-table";
import { EditableRole, ROLE } from "../../types";
import { LESSON_NIVO, LessonNivo } from "../lessons/constants";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { useUsersListQuery } from "./use-users-data";
import { UserFormValues, UserStatus } from "./user-form-schema";
import { normalizeUserUiLanguage, userPreferredLanguageFromApi } from "./user-preferred-language";

type Props = { enabled: boolean; canEdit: boolean; canCreateAdmin: boolean };

type CommunityRecord = { id: string; name: string };
type CreatedUserResponse = UserRecord & { invitationEmailSent?: boolean };
type ChildMetaRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  ssn?: string;
  birthDate?: string;
  nivo?: LessonNivo;
  communityId?: string;
  parents?: { parentId: string }[];
  address?: {
    streetLine1: string;
    streetLine2?: string | null;
    postalCode: string;
    city: string;
    state?: string | null;
    country: string;
  } | null;
};
type UserAddressInput = {
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
};
export function UsersPanel({ enabled, canEdit, canCreateAdmin }: Props) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [addChildForUser, setAddChildForUser] = useState<UserRecord | null>(null);
  const [editingChildFromDrawer, setEditingChildFromDrawer] = useState<ChildMetaRecord | null>(null);
  const [childFormApiError, setChildFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const queryClient = useQueryClient();
  const { canAdminManage, canChooseCommunity, isSuperAdmin } = useRoleAccess();
  const users = useUsersListQuery({ search, page, pageSize: DEFAULT_PAGE_SIZE, excludeMe: true }, enabled);
  const children = useAuthedQuery<ChildMetaRecord[]>("children-users-meta", "/children", enabled);
  const communities = useAuthedQuery<CommunityRecord[]>("communities-users", "/communities", enabled);
  const childParentUsers = useChildrenParentOptionsQuery(canAdminManage && Boolean(addChildForUser));
  const childCommunities = useChildrenCommunityOptionsQuery(canAdminManage && Boolean(addChildForUser));
  const createChildFromDrawer = useCreateChildMutation();
  const updateChildFromDrawer = useUpdateChildMutation(editingChildFromDrawer?.id || null);

  const communityById = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const community of communities.data || []) {
      lookup.set(community.id, community.name);
    }
    return lookup;
  }, [communities.data]);

  const communityOptions: CommunityOption[] = useMemo(
    () =>
      (communities.data || []).map((community) => ({
        id: community.id,
        name: community.name,
      })),
    [communities.data]
  );

  const usersWithChildrenCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const child of children.data || []) {
      for (const parent of child.parents || []) {
        counts.set(parent.parentId, (counts.get(parent.parentId) || 0) + 1);
      }
    }

    const usersList = users.data?.items || [];
    return usersList.map((user) => ({
      ...user,
      childrenCount: counts.get(user.id) || 0,
      communityName: user.communityId ? communityById.get(user.communityId) || null : null,
    }));
  }, [children.data, users.data, communityById]);

  const childrenByParentId = useMemo(() => {
    const lookup = new Map<string, ChildMetaRecord[]>();
    for (const child of children.data || []) {
      for (const parent of child.parents || []) {
        const existing = lookup.get(parent.parentId) || [];
        existing.push(child);
        lookup.set(parent.parentId, existing);
      }
    }
    return lookup;
  }, [children.data]);

  useEffect(() => {
    if (!selectedUser) return;
    const fresh = (users.data?.items || []).find((u) => u.id === selectedUser.id);
    if (fresh && fresh !== selectedUser) {
      setSelectedUser(fresh);
    }
  }, [users.data?.items, selectedUser]);

  useEffect(() => {
    if (!location.pathname.endsWith("/users")) return;
    const params = new URLSearchParams(location.search);
    const legacyChildId = params.get("childId")?.trim();
    if (!legacyChildId) return;
    const rawTab = params.get(CHILD_DRAWER_TAB_QUERY_KEY);
    const tabSuffix =
      rawTab && isChildDrawerTab(rawTab) && rawTab !== DEFAULT_CHILD_DRAWER_TAB
        ? `?${CHILD_DRAWER_TAB_QUERY_KEY}=${rawTab}`
        : "";
    navigate(`${childDetailPagePath(legacyChildId)}${tabSuffix}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const totalPages = Math.max(1, Math.ceil((users.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const usersLoading = users.isLoading || children.isLoading || communities.isLoading;

  const getApiMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };
  const getApiFieldError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string; field?: string } | undefined;
      return {
        field: data?.field,
        message: data?.message || fallback,
      };
    }
    return { message: fallback };
  };

  const toApiAddress = (address: UserFormValues["address"]): UserAddressInput | undefined => {
    const hasRequiredValues = Boolean(
      address.streetLine1.trim() &&
        address.postalCode.trim() &&
        address.city.trim() &&
        address.country.trim()
    );
    if (!hasRequiredValues) return undefined;

    return {
      streetLine1: address.streetLine1.trim(),
      streetLine2: address.streetLine2?.trim() || undefined,
      postalCode: address.postalCode.trim(),
      city: address.city.trim(),
      state: address.state?.trim() || undefined,
      country: address.country.trim(),
    };
  };

  const createUser = useMutation({
    mutationFn: async ({
      firstName,
      lastName,
      ssn,
      email,
      role,
      phoneNumber,
      communityId,
      address,
      preferredLanguage,
    }: {
      firstName: string;
      lastName: string;
      ssn: string;
      email: string;
      role: EditableRole;
      phoneNumber?: string;
      communityId?: string;
      address?: UserAddressInput;
      preferredLanguage: UserFormValues["preferredLanguage"];
    }) =>
      (
        await api.post("/users", {
          firstName,
          lastName,
          ssn,
          email,
          role,
          phoneNumber,
          communityId,
          address,
          preferredLanguage,
        })
      ).data as CreatedUserResponse,
    onSuccess: async (createdUser) => {
      setFormApiError(null);
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (createdUser.invitationEmailSent) {
        toast.success(t("usersToastCreatedWithEmail"));
      } else {
        toast.warning(t("usersToastCreatedNoEmail"));
      }
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, t("usersErrorCreateFailed"));
      setFormApiError(apiFieldError);
      toast.error(apiFieldError.message);
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      id,
      firstName,
      lastName,
      ssn,
      role,
      phoneNumber,
      communityId,
      status,
      address,
      preferredLanguage,
    }: {
      id: string;
      firstName: string;
      lastName: string;
      ssn: string;
      role: EditableRole;
      phoneNumber?: string;
      communityId?: string;
      status: UserStatus;
      address?: UserAddressInput;
      preferredLanguage: UserFormValues["preferredLanguage"];
    }) =>
      (
        await api.patch(`/users/${id}`, {
          firstName,
          lastName,
          ssn,
          role,
          phoneNumber,
          communityId,
          status,
          address,
          preferredLanguage,
        })
      ).data,
    onSuccess: async () => {
      setFormApiError(null);
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("usersToastUpdated"));
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, t("usersErrorUpdateFailed"));
      setFormApiError(apiFieldError);
      toast.error(apiFieldError.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted.");
      setDeletingUser(null);
    },
    onError: (error) => toast.error(getApiMessage(error, "Failed to delete user.")),
  });

  const linkableChildrenForUser: LinkableChildOption[] = useMemo(() => {
    if (!editingUser) return [];
    const userCommunityId = editingUser.communityId;
    if (!userCommunityId) return [];
    const linkedIds = new Set((childrenByParentId.get(editingUser.id) || []).map((c) => c.id));
    return (children.data || [])
      .filter((c) => !linkedIds.has(c.id))
      .filter((c) => !isSuperAdmin || c.communityId === userCommunityId)
      .map((c) => ({
        value: c.id,
        label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.id,
      }));
  }, [editingUser, children.data, childrenByParentId, isSuperAdmin]);

  const createChildrenForUser = async (
    userId: string,
    childrenPayload: UserFormValues["children"],
    communityId?: string,
  ) => {
    if (!childrenPayload.length) return;

    await Promise.all(
      childrenPayload.map((child) =>
        api.post("/children", {
          firstName: child.firstName,
          lastName: child.lastName,
          ssn: child.ssn,
          birthDate: child.birthDate,
          nivo: child.nivo,
          parentIds: [userId],
          communityId: isSuperAdmin ? communityId : undefined,
        })
      )
    );
  };

  const updateExistingChildren = async (
    childrenPayload: UserFormValues["children"]
  ) => {
    if (!childrenPayload.length) return;

    await Promise.all(
      childrenPayload.map((child) =>
        api.patch(`/children/${child.existingChildId}`, {
          firstName: child.firstName,
          lastName: child.lastName,
          ssn: child.ssn,
          birthDate: child.birthDate,
          nivo: child.nivo,
        })
      )
    );
  };

  const linkChildrenToUser = async (userId: string, childIds: string[]) => {
    if (!childIds.length) return;
    const allChildren = children.data || [];
    await Promise.all(
      childIds.map((childId) => {
        const child = allChildren.find((c) => c.id === childId);
        const currentParentIds = (child?.parents || []).map((p) => p.parentId);
        if (currentParentIds.includes(userId)) return Promise.resolve();
        return api.patch(`/children/${childId}`, {
          parentIds: [...currentParentIds, userId],
        });
      })
    );
  };

  const drawerChildParentOptions: ChildParentOption[] = useMemo(
    () =>
      (childParentUsers.data || [])
        .filter((u) => u.role !== ROLE.SUPER_ADMIN)
        .map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`.trim(),
          status: u.status,
          communityId: u.communityId,
        })),
    [childParentUsers.data]
  );

  const handleChildFormSubmit = (values: ChildFormValues) => {
    setChildFormApiError(null);
    const addressPayload =
      values.streetLine1.trim() && values.postalCode.trim() && values.city.trim() && values.country.trim()
        ? {
            streetLine1: values.streetLine1.trim(),
            streetLine2: values.streetLine2.trim() || undefined,
            postalCode: values.postalCode.trim(),
            city: values.city.trim(),
            state: values.stateValue.trim() || undefined,
            country: values.country.trim(),
          }
        : undefined;

    const onSuccess = async () => {
      setAddChildForUser(null);
      setEditingChildFromDrawer(null);
      setChildFormApiError(null);
      await queryClient.invalidateQueries({ queryKey: ["children-users-meta"] });
      await queryClient.invalidateQueries({ queryKey: ["children-by-id"] });
      toast.success(editingChildFromDrawer ? t("childrenUpdated") : t("childrenCreated"));
    };
    const onError = (error: unknown) => {
      const fallback = editingChildFromDrawer ? t("childrenUpdateFailed") : t("childrenCreateFailed");
      const apiFieldError = getApiFieldError(error, fallback);
      setChildFormApiError(apiFieldError);
      toast.error(apiFieldError.message);
    };

    if (editingChildFromDrawer) {
      updateChildFromDrawer.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          ssn: values.ssn.trim(),
          birthDate: values.birthDate,
          nivo: canAdminManage ? values.nivo : undefined,
          communityId: canAdminManage && canChooseCommunity ? values.communityId || undefined : undefined,
          parentIds: canAdminManage ? values.parentIds : undefined,
          address: addressPayload || null,
        },
        { onSuccess, onError }
      );
      return;
    }

    createChildFromDrawer.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        ssn: values.ssn.trim(),
        birthDate: values.birthDate,
        nivo: values.nivo,
        communityId: isSuperAdmin ? values.communityId || undefined : undefined,
        parentIds: values.parentIds,
        address: addressPayload,
      },
      { onSuccess, onError }
    );
  };

  return (
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, "flex h-full min-h-0 flex-col gap-5 overflow-hidden")}>
      {enabled ? (
        <>
          <div className="shrink-0">
            <EntityListToolbar
              search={search}
              onSearchChange={(value) => {
                setSearch((prev) => {
                  if (prev !== value) setPage(1);
                  return value;
                });
              }}
              placeholder={t("searchUsersPlaceholder")}
              actions={
                canEdit ? (
                  <Button
                    variant="outline"
                    className={ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME}
                    onClick={() => {
                      setEditingUser(null);
                      setFormApiError(null);
                      setFormOpen(true);
                    }}
                  >
                    <UserPlus className={ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME} aria-hidden />
                    <span className={ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME}>{t("createUser")}</span>
                  </Button>
                ) : null
              }
            />
          </div>

          <UsersTable
            users={usersWithChildrenCount}
            isLoading={usersLoading}
            page={page}
            totalPages={totalPages}
            totalItems={users.data?.total}
            showCommunityColumn={session?.user.role === ROLE.SUPER_ADMIN}
            canEdit={canEdit}
            onPageChange={setPage}
            onRowClick={setSelectedUser}
            onEdit={(user) => {
              if (!canEdit) return;
              if (user.role === ROLE.SUPER_ADMIN) {
                toast.error(t("usersErrorSuperAdminEdit"));
                return;
              }
              setEditingUser(user);
              setFormOpen(true);
            }}
            onDelete={(user) => {
              if (!canEdit) return;
              if (user.role === ROLE.SUPER_ADMIN) {
                toast.error(t("usersErrorSuperAdminDelete"));
                return;
              }
              setDeletingUser(user);
            }}
          />

          {canEdit ? (
            <UserFormDialog
              open={formOpen}
              mode={editingUser ? "edit" : "create"}
              canCreateAdmin={canCreateAdmin}
              canSelectCommunity={session?.user.role === ROLE.SUPER_ADMIN}
              forcedCommunityId={session?.user.role === ROLE.ADMIN ? session.user.communityId : null}
              communityOptions={communityOptions}
              submitting={createUser.isPending || updateUser.isPending}
              apiError={formApiError}
              defaultPreferredLanguage={normalizeUserUiLanguage(i18n.language)}
              readonlyCommunityName={
                session?.user.role !== ROLE.SUPER_ADMIN && editingUser?.communityId
                  ? communityById.get(editingUser.communityId) || null
                  : null
              }
              linkableChildren={editingUser ? linkableChildrenForUser : undefined}
              initialValues={
                editingUser
                  ? {
                      firstName: editingUser.firstName,
                      lastName: editingUser.lastName,
                      ssn: editingUser.ssn || "",
                      email: editingUser.email,
                      phoneNumber: editingUser.phoneNumber || "",
                      role:
                        editingUser.role === ROLE.SUPER_ADMIN
                          ? ROLE.ADMIN
                          : editingUser.role === ROLE.USER
                            ? ROLE.BOARD_MEMBER
                            : editingUser.role,
                      communityId: editingUser.communityId || "",
                      status: editingUser.status || "INACTIVE",
                      preferredLanguage: userPreferredLanguageFromApi(editingUser.preferredLanguage),
                      address: {
                        streetLine1: editingUser.address?.streetLine1 || "",
                        streetLine2: editingUser.address?.streetLine2 || "",
                        postalCode: editingUser.address?.postalCode || "",
                        city: editingUser.address?.city || "",
                        state: editingUser.address?.state || "",
                        country: editingUser.address?.country || "",
                      },
                      children: (childrenByParentId.get(editingUser.id) || []).map((child) => ({
                        existingChildId: child.id,
                        firstName: child.firstName || "",
                        lastName: child.lastName || "",
                        ssn: child.ssn || "",
                        birthDate: child.birthDate
                          ? new Date(child.birthDate).toISOString().slice(0, 10)
                          : "",
                        nivo: child.nivo || LESSON_NIVO.First,
                      })),
                    }
                  : undefined
              }
              onOpenChange={(open: boolean) => {
                setFormOpen(open);
                if (!open) {
                  setEditingUser(null);
                  setFormApiError(null);
                }
              }}
              onSubmit={(values: UserFormValues) => {
                if (editingUser) {
                  updateUser.mutate(
                    {
                      id: editingUser.id,
                      firstName: values.firstName,
                      lastName: values.lastName,
                      ssn: values.ssn,
                      role: values.role,
                      phoneNumber: values.phoneNumber || undefined,
                      communityId: values.communityId || undefined,
                      status: values.status,
                      address: toApiAddress(values.address),
                      preferredLanguage: values.preferredLanguage,
                    },
                    {
                      onSuccess: async () => {
                        try {
                          const existingUpdates = values.children.filter((c) => c.existingChildId);
                          const newChildren = values.children.filter((c) => !c.existingChildId);
                          await updateExistingChildren(existingUpdates);
                          await createChildrenForUser(editingUser.id, newChildren, values.communityId || undefined);
                          if (values.linkedChildIds.length > 0) {
                            await linkChildrenToUser(editingUser.id, values.linkedChildIds);
                          }
                        } catch (err) {
                          toast.error(getApiMessage(err, t("childrenCreateFailed")));
                        }
                        await queryClient.invalidateQueries({ queryKey: ["children-users-meta"] });
                      },
                    }
                  );
                  return;
                }

                createUser.mutate(
                  {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    ssn: values.ssn,
                    email: values.email,
                    role: values.role,
                    phoneNumber: values.phoneNumber || undefined,
                    communityId: values.communityId || undefined,
                    address: toApiAddress(values.address),
                    preferredLanguage: values.preferredLanguage,
                  },
                  {
                    onSuccess: async (createdUser) => {
                      if (!createdUser?.id) return;
                      try {
                        await createChildrenForUser(createdUser.id, values.children, values.communityId || undefined);
                      } catch (err) {
                        toast.error(getApiMessage(err, t("childrenCreateFailed")));
                      }
                      await queryClient.invalidateQueries({ queryKey: ["children-users-meta"] });
                    },
                  }
                );
              }}
            />
          ) : null}

          <EntityDetailsDrawer
            open={!!selectedUser}
            onOpenChange={(open) => {
              if (!open) setSelectedUser(null);
            }}
            title={
              selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : t("usersDrawerTitleFallback")
            }
            headerMeta={
              selectedUser ? (
                <StatusBadge
                  status={selectedUser.status || "INACTIVE"}
                />
              ) : undefined
            }
            editLabel={t("edit")}
            deleteLabel={t("delete")}
            deleteConfirmMessage={
              selectedUser
                ? t("usersDeleteDescription", { name: `${selectedUser.firstName} ${selectedUser.lastName}` })
                : undefined
            }
            onEdit={
              canEdit && selectedUser && selectedUser.role !== ROLE.SUPER_ADMIN
                ? () => {
                    setEditingUser(selectedUser);
                    setFormOpen(true);
                  }
                : undefined
            }
            onDelete={
              canEdit && selectedUser && selectedUser.role !== ROLE.SUPER_ADMIN
                ? () => deleteUser.mutate(selectedUser.id)
                : undefined
            }
          >
            {selectedUser ? (
              <UserDetailsDrawerContent
                user={selectedUser}
                communityName={
                  selectedUser.communityId
                    ? communityById.get(selectedUser.communityId) || selectedUser.communityId
                    : null
                }
                children={childrenByParentId.get(selectedUser.id) || []}
                onAddChild={
                  canEdit
                    ? () => setAddChildForUser(selectedUser)
                    : undefined
                }
                onEditChild={
                  canEdit
                    ? (childId) => {
                        const child = (children.data || []).find((c) => c.id === childId);
                        if (child) setEditingChildFromDrawer(child);
                      }
                    : undefined
                }
                onOpenChild={(id) => {
                  navigate(childDetailPagePath(id));
                }}
              />
            ) : null}
          </EntityDetailsDrawer>

          {canEdit && (addChildForUser || editingChildFromDrawer) ? (
            <ChildFormDialog
              open={Boolean(addChildForUser || editingChildFromDrawer)}
              mode={editingChildFromDrawer ? "edit" : "create"}
              initialValues={
                editingChildFromDrawer
                  ? {
                      firstName: editingChildFromDrawer.firstName || "",
                      lastName: editingChildFromDrawer.lastName || "",
                      ssn: editingChildFromDrawer.ssn || "",
                      birthDate: editingChildFromDrawer.birthDate
                        ? new Date(editingChildFromDrawer.birthDate).toISOString().slice(0, 10)
                        : "",
                      nivo: editingChildFromDrawer.nivo || LESSON_NIVO.First,
                      communityId: editingChildFromDrawer.communityId || "",
                      parentIds: (editingChildFromDrawer.parents || []).map((p) => p.parentId),
                      streetLine1: editingChildFromDrawer.address?.streetLine1 || "",
                      streetLine2: editingChildFromDrawer.address?.streetLine2 || "",
                      postalCode: editingChildFromDrawer.address?.postalCode || "",
                      city: editingChildFromDrawer.address?.city || "",
                      stateValue: editingChildFromDrawer.address?.state || "",
                      country: editingChildFromDrawer.address?.country || "",
                    }
                  : { parentIds: [addChildForUser!.id] }
              }
              canAdminManage={canAdminManage}
              canChooseCommunity={canChooseCommunity}
              parentOptions={drawerChildParentOptions}
              communityOptions={childCommunities.data || []}
              apiError={childFormApiError}
              submitting={createChildFromDrawer.isPending || updateChildFromDrawer.isPending}
              onSubmit={handleChildFormSubmit}
              onOpenChange={(open) => {
                if (!open) {
                  setAddChildForUser(null);
                  setEditingChildFromDrawer(null);
                  setChildFormApiError(null);
                }
              }}
            />
          ) : null}
          {canEdit ? (
            <DeleteConfirmDialog
              open={!!deletingUser}
              onOpenChange={(open) => {
                if (!open) setDeletingUser(null);
              }}
              title={t("usersDeleteTitle")}
              description={
                deletingUser
                  ? t("usersDeleteDescription", {
                      name: `${deletingUser.firstName} ${deletingUser.lastName}`,
                    })
                  : t("usersDeleteDescriptionGeneric")
              }
              confirmText={t("delete")}
              submitting={deleteUser.isPending}
              onConfirm={() => {
                if (!deletingUser) return;
                deleteUser.mutate(deletingUser.id);
              }}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">{t("usersVisibleRolesHint")}</p>
      )}
    </Card>
  );
}
