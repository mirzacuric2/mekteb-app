import { useOutletContext, useParams } from "react-router-dom";
import { PostsPanel } from "../posts/posts-panel";
import { UsersPanel } from "../users/users-panel";
import { ChildrenPanel } from "../children/children-panel";
import { LessonsPanel } from "../lessons/lessons-panel";
import { CommunitiesPanel } from "../communities/communities-panel";
import { CommunityPage } from "../communities/community-page";
import { NotificationsPanel } from "../notifications/notifications-panel";
import { HelpPanel } from "../help/help-panel";
import { PrivateLayoutContext } from "../../layouts/private-layout-context";
import { ActivitiesPanel } from "../reporting/activities-panel";
import { DashboardHomePanel } from "./dashboard-home-panel";
import { ROLE } from "../../types";
import { useSession } from "../auth/session-context";

export function DashboardRoute() {
  return <DashboardHomePanel />;
}

export function PostsRoute() {
  const { canPublishPosts } = useOutletContext<PrivateLayoutContext>();
  return <PostsPanel canPublish={canPublishPosts} />;
}

export function UsersRoute() {
  const { canManageUsers, canEditUsers, canCreateAdmin } = useOutletContext<PrivateLayoutContext>();
  return <UsersPanel enabled={canManageUsers} canEdit={canEditUsers} canCreateAdmin={canCreateAdmin} />;
}

export function ChildrenRoute() {
  const { canManageChildren } = useOutletContext<PrivateLayoutContext>();
  return <ChildrenPanel canManage={canManageChildren} />;
}

export function ActivitiesRoute() {
  const { canManageActivities } = useOutletContext<PrivateLayoutContext>();
  return <ActivitiesPanel enabled={canManageActivities} />;
}

export function LessonsRoute() {
  const { canManageLessons } = useOutletContext<PrivateLayoutContext>();
  return <LessonsPanel canManage={canManageLessons} />;
}

export function CommunitiesRoute() {
  const { session } = useSession();
  const { communityId: selectedCommunityId } = useParams<{ communityId?: string }>();
  const { canManageCommunities, canCreateCommunities, canAssignCommunityAdmins } =
    useOutletContext<PrivateLayoutContext>();
  const shouldUseSingleCommunityPage =
    session?.user.role === ROLE.ADMIN || session?.user.role === ROLE.BOARD_MEMBER;

  if (shouldUseSingleCommunityPage || Boolean(selectedCommunityId)) {
    return (
      <CommunityPage
        canManage={canManageCommunities}
        canAssignAdmins={canAssignCommunityAdmins}
        selectedCommunityId={selectedCommunityId}
      />
    );
  }

  return (
    <CommunitiesPanel
      canManage={canManageCommunities}
      canCreate={canCreateCommunities}
      canAssignAdmins={canAssignCommunityAdmins}
    />
  );
}

export function NotificationsRoute() {
  return <NotificationsPanel />;
}

export function HelpRoute() {
  return <HelpPanel />;
}
