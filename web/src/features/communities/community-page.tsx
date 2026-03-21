import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Building2, CalendarDays, Edit3, GraduationCap, LayoutDashboard, MapPin, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../../api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Tabs } from "../../components/ui/tabs";
import { ROLE } from "../../types";
import { useSession } from "../auth/session-context";
import { LoadingBlock } from "../common/components/loading-block";
import { NaValue } from "../common/components/na-value";
import { useAuthedQuery } from "../common/use-authed-query";
import { COMMUNITIES_API_PATH, COMMUNITIES_QUERY_KEY } from "./constants";
import { formatAddressLine, formatUserOptionLabel } from "./community-utils";
import { CommunityMembersForm } from "./community-page-forms";
import { CommunityOverviewTab } from "./community-overview-tab";
import { CommunityBasicInfoDialog, CommunityBasicInfoValues } from "./community-basic-info-dialog";
import {
  AdminOption,
  CommunityFormValues,
} from "./community-form-dialog";
import { CommunityRecord } from "./types";
import { CommunityEventsPanel } from "../events/community-events-panel";
import { CommunityDiplomasTab } from "./diplomas/community-diplomas-tab";

type Props = {
  canManage: boolean;
  canAssignAdmins: boolean;
  selectedCommunityId?: string | null;
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
};

export function CommunityPage({ canManage, canAssignAdmins, selectedCommunityId }: Props) {
  const { t } = useTranslation();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "events" | "diplomas">("overview");
  const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false);
  const canManageEvents =
    session?.user.role === ROLE.SUPER_ADMIN ||
    session?.user.role === ROLE.ADMIN ||
    session?.user.role === ROLE.BOARD_MEMBER;
  const hoverActionsForDesktop =
    session?.user.role === ROLE.SUPER_ADMIN || session?.user.role === ROLE.ADMIN;
  const canConfigureDiplomas =
    session?.user.role === ROLE.SUPER_ADMIN || session?.user.role === ROLE.ADMIN;

  useEffect(() => {
    if (activeTab === "diplomas" && !canConfigureDiplomas) setActiveTab("overview");
  }, [activeTab, canConfigureDiplomas]);

  const communities = useAuthedQuery<CommunityRecord[]>(COMMUNITIES_QUERY_KEY, COMMUNITIES_API_PATH, canManage);
  const directoryUsers = useAuthedQuery<DirectoryUser[]>("directory-users", "/directory", canManage);
  const users = useAuthedQuery<UserRecord[]>("community-admin-users", "/users", canManage && canAssignAdmins);

  const activeCommunity = useMemo(() => {
    const all = communities.data || [];
    if (!all.length) return null;
    if (selectedCommunityId) {
      const bySelectedId = all.find((community) => community.id === selectedCommunityId);
      if (bySelectedId) return bySelectedId;
    }
    if (session?.user.communityId) {
      const bySession = all.find((community) => community.id === session.user.communityId);
      if (bySession) return bySession;
    }
    return all[0];
  }, [communities.data, selectedCommunityId, session?.user.communityId]);

  const communityDetails = useQuery<CommunityRecord>({
    queryKey: ["community-details", activeCommunity?.id],
    queryFn: async () => (await api.get(`${COMMUNITIES_API_PATH}/${activeCommunity?.id}`)).data,
    enabled: canManage && Boolean(activeCommunity?.id),
  });

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

  const boardMemberUserOptions = useMemo(() => {
    const targetCommunityId = activeCommunity?.id;
    const baseOptions = (directoryUsers.data || [])
      .filter((user) => {
        if (user.role !== ROLE.BOARD_MEMBER) return false;
        if (!targetCommunityId) return true;
        return !user.communityId || user.communityId === targetCommunityId;
      })
      .map((user) => ({
        id: user.id,
        label: formatUserOptionLabel(user),
      }));

    const optionMap = new Map(baseOptions.map((option) => [option.id, option]));
    for (const member of communityDetails.data?.boardMembers || []) {
      const linkedUserId = (member.userId || member.user?.id || "").trim();
      if (!linkedUserId || optionMap.has(linkedUserId)) continue;
      optionMap.set(linkedUserId, {
        id: linkedUserId,
        label: member.user ? formatUserOptionLabel(member.user) : linkedUserId,
      });
    }

    return Array.from(optionMap.values());
  }, [activeCommunity?.id, communityDetails.data?.boardMembers, directoryUsers.data]);

  const assignedAdmins = useMemo<AdminOption[]>(
    () =>
      (communityDetails.data?.users || activeCommunity?.users || []).map((admin) => ({
        id: admin.id,
        label: formatUserOptionLabel(admin),
      })),
    [activeCommunity?.users, communityDetails.data?.users]
  );

  const getApiMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };

  const updateCommunity = useMutation({
    mutationFn: async (values: CommunityFormValues) =>
      (
        await api.patch(`${COMMUNITIES_API_PATH}/${activeCommunity?.id}`, {
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
      if (activeCommunity?.id) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", activeCommunity.id] });
      }
      toast.success(t("communitiesUpdated"));
      setBasicInfoDialogOpen(false);
    },
    onError: (error) => toast.error(getApiMessage(error, t("communitiesUpdateFailed"))),
  });

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{t("communitiesVisibleForAdminOnly")}</p>
      </Card>
    );
  }

  if (communities.isLoading || communityDetails.isLoading) {
    return (
      <Card>
        <LoadingBlock text="" containerClassName="min-h-[220px] border-0" />
      </Card>
    );
  }

  if (!activeCommunity) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{t("communityNotAssigned")}</p>
      </Card>
    );
  }

  const details = communityDetails.data || activeCommunity;
  const addressLine = formatAddressLine(details.address || {});
  const basicInfoInitialValues: CommunityBasicInfoValues = {
    name: details.name,
    description: details.description || "",
    contactEmail: details.contactEmail || "",
    contactPhone: details.contactPhone || "",
    address: {
      streetLine1: details.address?.streetLine1 || "",
      streetLine2: details.address?.streetLine2 || "",
      postalCode: details.address?.postalCode || "",
      city: details.address?.city || "",
      state: details.address?.state || "",
      country: details.address?.country || "",
    },
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold">{details.name}</h2>
            </div>
            <NaValue value={details.description} className="text-sm text-slate-600" />
          </div>
          <Button type="button" variant="outline" onClick={() => setBasicInfoDialogOpen(true)}>
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("edit")}</span>
          </Button>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-500" />
          <NaValue value={addressLine} className="text-sm text-slate-600" />
        </div>
      </Card>

      <Card className="space-y-4">
        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value as "overview" | "members" | "events" | "diplomas")}
          tabs={[
            { key: "overview", label: t("communityOverviewTab"), icon: LayoutDashboard },
            { key: "members", label: t("communitiesBoardMembersLabel"), icon: UsersRound },
            { key: "events", label: t("communityEventsTab"), icon: CalendarDays },
            ...(canConfigureDiplomas
              ? [{ key: "diplomas" as const, label: t("communityDiplomasTab"), icon: GraduationCap }]
              : []),
          ]}
        >
          {activeTab === "overview" ? (
            <CommunityOverviewTab />
          ) : activeTab === "members" ? (
            <CommunityMembersForm
              community={details}
              canAssignAdmins={canAssignAdmins}
              currentUserId={session?.user.id || ""}
              restrictOwnBoardMemberAssignmentEdit={session?.user.role === ROLE.BOARD_MEMBER}
              assignedAdmins={assignedAdmins}
              adminOptions={adminOptions}
              boardMemberUserOptions={boardMemberUserOptions}
              submitting={updateCommunity.isPending}
              onSubmit={(values) =>
                updateCommunity.mutate({
                  name: details.name,
                  description: details.description || "",
                  contactEmail: details.contactEmail || "",
                  contactPhone: details.contactPhone || "",
                  address: {
                    streetLine1: details.address?.streetLine1 || "",
                    streetLine2: details.address?.streetLine2 || "",
                    postalCode: details.address?.postalCode || "",
                    city: details.address?.city || "",
                    state: details.address?.state || "",
                    country: details.address?.country || "",
                  },
                  ...values,
                })
              }
            />
          ) : activeTab === "events" ? (
            <CommunityEventsPanel
              communityId={details.id}
              canManageEvents={canManageEvents}
              hoverActionsForDesktop={hoverActionsForDesktop}
            />
          ) : (
            <CommunityDiplomasTab community={details} />
          )}
        </Tabs>
      </Card>

      <CommunityBasicInfoDialog
        open={basicInfoDialogOpen}
        submitting={updateCommunity.isPending}
        canAssignAdmins={canAssignAdmins}
        initialValues={basicInfoInitialValues}
        onOpenChange={setBasicInfoDialogOpen}
        onSubmit={(values) =>
          updateCommunity.mutate({
            ...values,
            adminUserIds: details.users?.map((admin) => admin.id) || [],
            boardMembers:
              details.boardMembers
                ?.filter((member) => Boolean((member.userId || member.user?.id || "").trim()))
                .map((member) => ({
                  userId: (member.userId || member.user?.id || "").trim(),
                  role: member.role,
                })) || [],
          })
        }
      />
    </div>
  );
}
