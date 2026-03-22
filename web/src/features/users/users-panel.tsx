import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { api } from "../../api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { useSession } from "../auth/session-context";
import { useAuthedQuery } from "../common/use-authed-query";
import { useChildByIdQuery } from "../children/use-children-data";
import { ProgressChildDetailsDrawer } from "../dashboard/progress-child-details-drawer";
import { LESSONS_API_PATH, LESSONS_QUERY_KEY } from "../lessons/constants";
import { Lesson } from "../lessons/types";
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
import { CommunityOption, UserFormDialog } from "../users/user-form-dialog";
import { UserDetailsDrawerContent } from "./user-details-drawer-content";
import { UserRecord, UsersTable } from "./users-table";
import { EditableRole, ROLE } from "../../types";
import { LessonNivo } from "../lessons/constants";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { useUsersListQuery } from "./use-users-data";
import { UserFormValues, UserStatus } from "./user-form-schema";

type Props = { enabled: boolean; canEdit: boolean; canCreateAdmin: boolean };

type CommunityRecord = { id: string; name: string };
type CreatedUserResponse = UserRecord & { invitationEmailSent?: boolean };
type ChildMetaRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  nivo?: LessonNivo;
  parents?: { parentId: string }[];
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
  const { t } = useTranslation();
  const { session } = useSession();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [childDrawerId, setChildDrawerId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const queryClient = useQueryClient();
  const isBoardMember = session?.user.role === ROLE.BOARD_MEMBER;
  const users = useUsersListQuery({ search, page, pageSize: DEFAULT_PAGE_SIZE, excludeMe: true }, enabled);
  const children = useAuthedQuery<ChildMetaRecord[]>(
    "children-users-meta",
    isBoardMember ? "/children?communityScope=1" : "/children",
    enabled
  );
  const communities = useAuthedQuery<CommunityRecord[]>("communities-users", "/communities", enabled);

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

  const childDrawerQuery = useChildByIdQuery(childDrawerId ?? undefined, false);
  const childForDrawer = childDrawerQuery.data ?? null;
  const lessonsForChildDrawer = useAuthedQuery<Lesson[]>(
    LESSONS_QUERY_KEY,
    LESSONS_API_PATH,
    Boolean(childForDrawer)
  );
  const childDrawerScheduledLessons = useMemo(() => {
    if (!childForDrawer) return 0;
    return (lessonsForChildDrawer.data || []).filter((lesson) => lesson.nivo === childForDrawer.nivo).length;
  }, [lessonsForChildDrawer.data, childForDrawer]);

  useEffect(() => {
    if (!childDrawerId) return;
    if (childDrawerQuery.isPending || childDrawerQuery.isFetching) return;
    if (childDrawerQuery.isError) {
      toast.error(t("usersChildDrawerLoadFailed"));
      setChildDrawerId(null);
      return;
    }
    if (childDrawerQuery.isSuccess && !childDrawerQuery.data) {
      toast.error(t("usersChildDrawerLoadFailed"));
      setChildDrawerId(null);
    }
  }, [
    childDrawerId,
    childDrawerQuery.data,
    childDrawerQuery.isError,
    childDrawerQuery.isFetching,
    childDrawerQuery.isPending,
    childDrawerQuery.isSuccess,
    t,
  ]);

  const totalPages = Math.max(1, Math.ceil((users.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const currentPage = users.data?.page || page;
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
    }: {
      firstName: string;
      lastName: string;
      ssn: string;
      email: string;
      role: EditableRole;
      phoneNumber?: string;
      communityId?: string;
      address?: UserAddressInput;
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
        })
      ).data as CreatedUserResponse,
    onSuccess: async (createdUser) => {
      setFormApiError(null);
      setFormOpen(false);
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (createdUser.invitationEmailSent) {
        toast.success("User created and verification email sent.");
      } else {
        toast.warning("User created, but verification email was not sent.");
      }
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, "Failed to create user.");
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
        })
      ).data,
    onSuccess: async () => {
      setFormApiError(null);
      setFormOpen(false);
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated.");
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, "Failed to update user.");
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

  const createChildrenForUser = async (
    userId: string,
    childrenPayload: UserFormValues["children"]
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
        })
      )
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
                setSearch(value);
                setPage(1);
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
            page={currentPage}
            totalPages={totalPages}
            showCommunityColumn={session?.user.role === ROLE.SUPER_ADMIN}
            canEdit={canEdit}
            onPageChange={setPage}
            onRowClick={setSelectedUser}
            onEdit={(user) => {
              if (!canEdit) return;
              if (user.role === ROLE.SUPER_ADMIN) {
                toast.error("Super admin cannot be edited here.");
                return;
              }
              setEditingUser(user);
              setFormOpen(true);
            }}
            onDelete={(user) => {
              if (!canEdit) return;
              if (user.role === ROLE.SUPER_ADMIN) {
                toast.error("Super admin cannot be deleted.");
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
                      address: {
                        streetLine1: editingUser.address?.streetLine1 || "",
                        streetLine2: editingUser.address?.streetLine2 || "",
                        postalCode: editingUser.address?.postalCode || "",
                        city: editingUser.address?.city || "",
                        state: editingUser.address?.state || "",
                        country: editingUser.address?.country || "",
                      },
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
                    },
                    {
                      onSuccess: async () => {
                        await createChildrenForUser(editingUser.id, values.children);
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
                  },
                  {
                    onSuccess: async (createdUser) => {
                      if (!createdUser?.id) return;
                      await createChildrenForUser(createdUser.id, values.children);
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
              selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : "User details"
            }
            headerSubline={selectedUser ? <Role role={selectedUser.role} /> : undefined}
            headerMeta={
              selectedUser ? (
                <StatusBadge
                  status={selectedUser.status || "INACTIVE"}
                />
              ) : undefined
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
                onOpenChild={(id) => setChildDrawerId(id)}
              />
            ) : null}
          </EntityDetailsDrawer>

          <ProgressChildDetailsDrawer
            open={Boolean(childDrawerId)}
            isLoading={
              Boolean(childDrawerId) &&
              !childForDrawer &&
              (childDrawerQuery.isPending || childDrawerQuery.isFetching)
            }
            onOpenChange={(open) => {
              if (!open) setChildDrawerId(null);
            }}
            child={childForDrawer}
            summary={null}
            scheduledLessons={childDrawerScheduledLessons}
          />
          {canEdit ? (
            <DeleteConfirmDialog
              open={!!deletingUser}
              onOpenChange={(open) => {
                if (!open) setDeletingUser(null);
              }}
              title="Delete user"
              description={
                deletingUser
                  ? `Are you sure you want to delete ${deletingUser.firstName} ${deletingUser.lastName}?`
                  : "Delete selected user?"
              }
              confirmText="Delete"
              submitting={deleteUser.isPending}
              onConfirm={() => {
                if (!deletingUser) return;
                deleteUser.mutate(deletingUser.id);
              }}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">Visible for ADMIN and SUPER_ADMIN.</p>
      )}
    </Card>
  );
}
