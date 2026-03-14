import { useOutletContext } from "react-router-dom";
import { PostsPanel } from "../posts/posts-panel";
import { UsersPanel } from "../users/users-panel";
import { ChildrenPanel } from "../children/children-panel";
import { LessonsPanel } from "../lessons/lessons-panel";
import { CommunitiesPanel } from "../communities/communities-panel";
import { MessagesPanel } from "../messages/messages-panel";
import { NotificationsPanel } from "../notifications/notifications-panel";
import { HelpPanel } from "../help/help-panel";
import { PrivateLayoutContext } from "../../layouts/private-layout-context";

export function PostsRoute() {
  const { canPublishPosts } = useOutletContext<PrivateLayoutContext>();
  return <PostsPanel canPublish={canPublishPosts} />;
}

export function UsersRoute() {
  const { canManageUsers, canCreateAdmin } = useOutletContext<PrivateLayoutContext>();
  return <UsersPanel enabled={canManageUsers} canCreateAdmin={canCreateAdmin} />;
}

export function ChildrenRoute() {
  const { canManageChildren } = useOutletContext<PrivateLayoutContext>();
  return <ChildrenPanel canManage={canManageChildren} />;
}

export function LessonsRoute() {
  const { canManageLessons } = useOutletContext<PrivateLayoutContext>();
  return <LessonsPanel canManage={canManageLessons} />;
}

export function CommunitiesRoute() {
  const { canManageCommunities, canCreateCommunities, canAssignCommunityAdmins } =
    useOutletContext<PrivateLayoutContext>();
  return (
    <CommunitiesPanel
      canManage={canManageCommunities}
      canCreate={canCreateCommunities}
      canAssignAdmins={canAssignCommunityAdmins}
    />
  );
}

export function MessagesRoute() {
  return <MessagesPanel />;
}

export function NotificationsRoute() {
  return <NotificationsPanel />;
}

export function HelpRoute() {
  return <HelpPanel />;
}
