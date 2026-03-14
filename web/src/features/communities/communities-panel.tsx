import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ROLE } from "../../types";
import { useSession } from "../auth/session-context";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { Loader } from "../common/components/loader";
import { useAuthedQuery } from "../common/use-authed-query";
import { COMMUNITIES_API_PATH, COMMUNITIES_QUERY_KEY } from "./constants";
import { AdminOption, CommunityFormDialog, CommunityFormValues } from "./community-form-dialog";
import { CommunityRecord } from "./types";

type Props = {
  canManage: boolean;
  canCreate: boolean;
  canAssignAdmins: boolean;
};

type DirectoryUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  communityId?: string | null;
};

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  communityId?: string | null;
};

function formatUserOptionLabel(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed user";
  return user.email ? `${fullName} (${user.email})` : fullName;
}

function buildAddressPayload(address: {
  streetLine1?: string;
  streetLine2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
}) {
  const hasRequiredFields = Boolean(
    address.streetLine1?.trim() &&
      address.postalCode?.trim() &&
      address.city?.trim() &&
      address.country?.trim()
  );
  if (!hasRequiredFields) return undefined;
  return {
    streetLine1: address.streetLine1?.trim(),
    streetLine2: address.streetLine2?.trim() || undefined,
    postalCode: address.postalCode?.trim(),
    city: address.city?.trim(),
    state: address.state?.trim() || undefined,
    country: address.country?.trim(),
  };
}

export function CommunitiesPanel({ canManage, canCreate, canAssignAdmins }: Props) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<CommunityRecord | null>(null);
  const [deletingCommunity, setDeletingCommunity] = useState<CommunityRecord | null>(null);

  const communities = useAuthedQuery<CommunityRecord[]>(COMMUNITIES_QUERY_KEY, COMMUNITIES_API_PATH, canManage);
  const directoryUsers = useAuthedQuery<DirectoryUser[]>("directory-users", "/directory", canManage);
  const users = useAuthedQuery<UserRecord[]>("community-admin-users", "/users", canManage);

  const editingCommunityDetails = useQuery<CommunityRecord>({
    queryKey: ["community-details", editingCommunity?.id],
    queryFn: async () => (await api.get(`${COMMUNITIES_API_PATH}/${editingCommunity?.id}`)).data,
    enabled: canManage && Boolean(editingCommunity?.id),
  });

  const getApiMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };

  const filteredCommunities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return communities.data || [];
    return (communities.data || []).filter((community) => {
      return (
        community.name.toLowerCase().includes(term) ||
        community.address?.city?.toLowerCase().includes(term) ||
        community.address?.country?.toLowerCase().includes(term)
      );
    });
  }, [communities.data, search]);

  const adminOptions = useMemo<AdminOption[]>(
    () =>
      (users.data || [])
        .filter((user) => user.role === ROLE.ADMIN)
        .map((user) => ({
          id: user.id,
          label: formatUserOptionLabel(user),
        })),
    [users.data]
  );

  const boardMemberUserOptions = useMemo(
    () =>
      (directoryUsers.data || [])
        .filter((user) => {
          const targetCommunityId = editingCommunity?.id;
          if (!targetCommunityId) return true;
          return !user.communityId || user.communityId === targetCommunityId;
        })
        .map((user) => ({
          id: user.id,
          label: formatUserOptionLabel(user),
        })),
    [directoryUsers.data, editingCommunity?.id]
  );

  const createCommunity = useMutation({
    mutationFn: async (values: CommunityFormValues) =>
      (
        await api.post(COMMUNITIES_API_PATH, {
          name: values.name,
          description: values.description || undefined,
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          address: values.address,
          adminUserIds: values.adminUserIds,
          boardMembers: values.boardMembers.map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
        })
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      if (editingCommunity?.id) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", editingCommunity.id] });
      }
      toast.success("Community created.");
      setFormOpen(false);
      setEditingCommunity(null);
    },
    onError: (error) => toast.error(getApiMessage(error, "Failed to create community.")),
  });

  const updateCommunity = useMutation({
    mutationFn: async (values: CommunityFormValues) =>
      (
        await api.patch(`${COMMUNITIES_API_PATH}/${editingCommunity?.id}`, {
          name: canAssignAdmins ? values.name : undefined,
          description: canAssignAdmins ? values.description || undefined : undefined,
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          address: values.address,
          adminUserIds: canAssignAdmins ? values.adminUserIds : undefined,
          boardMembers: values.boardMembers.map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
        })
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      if (editingCommunity?.id) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", editingCommunity.id] });
      }
      toast.success("Community updated.");
      setFormOpen(false);
      setEditingCommunity(null);
    },
    onError: (error) => toast.error(getApiMessage(error, "Failed to update community.")),
  });

  const deleteCommunity = useMutation({
    mutationFn: async (id: string) => api.delete(`${COMMUNITIES_API_PATH}/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      toast.success("Community inactivated.");
      setDeletingCommunity(null);
    },
    onError: (error) => toast.error(getApiMessage(error, "Failed to inactivate community.")),
  });

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Visible for ADMIN and SUPER_ADMIN.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <EntityListToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search communities by name or city..."
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingCommunity(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create community
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-2">
        {communities.isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border">
            <Loader size="md" />
          </div>
        ) : filteredCommunities.length ? (
          filteredCommunities.map((community) => (
            <div
              key={community.id}
              className={`rounded-md border border-border p-3 transition-colors ${
                community.status === "INACTIVE" ? "cursor-default bg-slate-100/60" : "cursor-pointer hover:bg-slate-50"
              }`}
              role={community.status === "INACTIVE" ? undefined : "button"}
              tabIndex={community.status === "INACTIVE" ? -1 : 0}
              onClick={() => {
                if (community.status === "INACTIVE") return;
                setEditingCommunity(community);
                setFormOpen(true);
              }}
              onKeyDown={(event) => {
                if (community.status === "INACTIVE") return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setEditingCommunity(community);
                  setFormOpen(true);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-full text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{community.name}</p>
                    {community.status === "INACTIVE" ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    {community.address?.city || "No city"} - {community.address?.country || "No country"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Admins: {community.users?.length || 0} | Board members: {community._count?.boardMembers || 0}
                  </p>
                </div>
                {canCreate && community.status !== "INACTIVE" ? (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      setDeletingCommunity(community);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Inactivate
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No communities found.</p>
        )}
      </div>

      <CommunityFormDialog
        open={formOpen}
        mode={editingCommunity ? "edit" : "create"}
        submitting={createCommunity.isPending || updateCommunity.isPending}
        canAssignAdmins={canAssignAdmins}
        assignedAdmins={
          editingCommunity?.users?.map((admin) => ({
            id: admin.id,
            label: formatUserOptionLabel(admin),
          })) || []
        }
        adminOptions={adminOptions}
        boardMemberUserOptions={boardMemberUserOptions}
        initialValues={
          editingCommunity
            ? {
                name: editingCommunity.name,
                description: editingCommunity.description || "",
                contactEmail: editingCommunity.contactEmail || "",
                contactPhone: editingCommunity.contactPhone || "",
                address: {
                  streetLine1: editingCommunity.address?.streetLine1 || "",
                  streetLine2: editingCommunity.address?.streetLine2 || "",
                  postalCode: editingCommunity.address?.postalCode || "",
                  city: editingCommunity.address?.city || "",
                  state: editingCommunity.address?.state || "",
                  country: editingCommunity.address?.country || "",
                },
                adminUserIds: editingCommunity.users?.map((admin) => admin.id) || [],
                boardMembers:
                  editingCommunityDetails.data?.boardMembers
                    ?.filter((member) => Boolean(member.userId))
                    .map((member) => ({
                      userId: member.userId || "",
                      role: member.role,
                    })) || [],
              }
            : undefined
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCommunity(null);
        }}
        onSubmit={(values) => {
          if (!editingCommunity && canAssignAdmins && !values.adminUserIds.length) {
            toast.error("At least one ADMIN assignment is required. You can assign multiple.");
            return;
          }
          if (editingCommunity) {
            updateCommunity.mutate(values);
            return;
          }
          createCommunity.mutate(values);
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingCommunity}
        onOpenChange={(open) => {
          if (!open) setDeletingCommunity(null);
        }}
        title="Inactivate community"
        description={
          deletingCommunity
            ? `Inactivate "${deletingCommunity.name}"? It will be hidden from active lists.`
            : "Inactivate selected community?"
        }
        confirmText="Inactivate"
        submitting={deleteCommunity.isPending}
        onConfirm={() => {
          if (!deletingCommunity) return;
          deleteCommunity.mutate(deletingCommunity.id);
        }}
      />

    </Card>
  );
}
