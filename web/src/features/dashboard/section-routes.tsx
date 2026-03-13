import { useOutletContext } from "react-router-dom";
import { PostsPanel } from "../posts/posts-panel";
import { UsersPanel } from "../users/users-panel";
import { ChildrenPanel } from "../children/children-panel";
import { LessonsPanel } from "../lessons/lessons-panel";
import { MessagesPanel } from "../messages/messages-panel";
import { NotificationsPanel } from "../notifications/notifications-panel";
import { PrivateLayoutContext } from "../../layouts/private-layout-context";

export function PostsRoute() {
  const { canManage } = useOutletContext<PrivateLayoutContext>();
  return <PostsPanel canPublish={canManage} />;
}

export function UsersRoute() {
  const { canManage, canCreateAdmin } = useOutletContext<PrivateLayoutContext>();
  return <UsersPanel enabled={canManage} canCreateAdmin={canCreateAdmin} />;
}

export function ChildrenRoute() {
  const { canManage } = useOutletContext<PrivateLayoutContext>();
  return <ChildrenPanel canManage={canManage} />;
}

export function LessonsRoute() {
  const { canManageLessons } = useOutletContext<PrivateLayoutContext>();
  return <LessonsPanel canManage={canManageLessons} />;
}

export function MessagesRoute() {
  return <MessagesPanel />;
}

export function NotificationsRoute() {
  return <NotificationsPanel />;
}
