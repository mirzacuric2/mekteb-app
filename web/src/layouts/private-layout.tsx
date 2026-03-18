import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  BookOpen,
  ClipboardList,
  ClipboardPenLine,
  ChevronRight,
  CircleHelp,
  House,
  Mail,
  Newspaper,
  PanelLeft,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { DashboardSidebar } from "../components/layout/dashboard-sidebar";
import { dashboardSections, isSectionKey, SectionKey } from "../features/dashboard/sections";
import { useSession } from "../features/auth/session-context";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "../components/ui/sidebar";
import { PrivateLayoutContext } from "./private-layout-context";
import { ROLE } from "../types";
import { ActivityReportDialog } from "../features/reporting/activity-report-dialog";
import { DockedChatPanel } from "../features/messages/docked-chat-panel";
import { ChatControllerProvider, useChatController } from "../features/messages/chat-controller";
import { NotificationBellMenu } from "../features/notifications/notification-bell-menu";
import { useMessageNewIndicator } from "../features/messages/use-message-new-indicator";

function PrivateLayoutShell() {
  const { t, i18n } = useTranslation();
  const { session, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { openChat } = useChatController();
  const { open, setOpen, setOpenMobile } = useSidebar();
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const messageIndicator = useMessageNewIndicator(Boolean(session));
  const currentSegment = location.pathname.split("/").pop() || "dashboard";
  const canManageUsers = session?.user.role === ROLE.ADMIN || session?.user.role === ROLE.SUPER_ADMIN;
  const canReportActivities = session?.user.role === ROLE.ADMIN || session?.user.role === ROLE.SUPER_ADMIN;
  const canManageActivities = canReportActivities;
  const canManageLessons = session?.user.role === ROLE.SUPER_ADMIN;
  const canManageChildren =
    session?.user.role === ROLE.ADMIN ||
    session?.user.role === ROLE.SUPER_ADMIN ||
    session?.user.role === ROLE.PARENT ||
    session?.user.role === ROLE.USER ||
    session?.user.role === ROLE.BOARD_MEMBER;
  const canManageCommunities =
    session?.user.role === ROLE.ADMIN ||
    session?.user.role === ROLE.SUPER_ADMIN ||
    session?.user.role === ROLE.BOARD_MEMBER;
  const canPublishPosts = session?.user.role === ROLE.ADMIN;
  const canManage = canManageUsers || canManageChildren || canManageCommunities;

  useEffect(() => {
    if (!isSectionKey(currentSegment)) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    if (currentSegment === "users" && !canManageUsers) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    if (currentSegment === "children" && !canManageChildren) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    if (currentSegment === "activities" && !canManageActivities) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    if (currentSegment === "communities" && !canManageCommunities) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    if (currentSegment === "lessons" && !canManageLessons) {
      navigate("/app/dashboard", { replace: true });
      return;
    }
    setOpenMobile(false);
  }, [canManageActivities, canManageChildren, canManageCommunities, canManageLessons, canManageUsers, currentSegment, navigate, setOpenMobile]);

  if (!session) return null;

  const activeKey: SectionKey = isSectionKey(currentSegment) ? currentSegment : "dashboard";
  const selectedSection = dashboardSections.find((section) => section.key === activeKey) ?? dashboardSections[0];
  const breadcrumbIcon = {
    dashboard: <House className="h-4 w-4 text-slate-500" />,
    posts: <Newspaper className="h-4 w-4 text-slate-500" />,
    help: <CircleHelp className="h-4 w-4 text-slate-500" />,
    notifications: <Bell className="h-4 w-4 text-slate-500" />,
    users: <Users className="h-4 w-4 text-slate-500" />,
    children: <UserRound className="h-4 w-4 text-slate-500" />,
    activities: <ClipboardList className="h-4 w-4 text-slate-500" />,
    lessons: <BookOpen className="h-4 w-4 text-slate-500" />,
    communities: <Building2 className="h-4 w-4 text-slate-500" />,
  }[activeKey];
  const initials = `${session.user.firstName[0] ?? ""}${session.user.lastName[0] ?? ""}`.toUpperCase();

  const context = useMemo<PrivateLayoutContext>(
    () => ({
      canManage,
      canManageUsers,
      canManageChildren,
      canManageActivities,
      canPublishPosts,
      canCreateAdmin: session.user.role === ROLE.SUPER_ADMIN,
      canManageLessons,
      canManageCommunities,
      canCreateCommunities: session.user.role === ROLE.SUPER_ADMIN,
      canAssignCommunityAdmins: session.user.role === ROLE.SUPER_ADMIN,
    }),
    [canManage, canManageActivities, canManageChildren, canManageCommunities, canManageLessons, canManageUsers, canPublishPosts, session.user.role]
  );

  return (
    <div className="relative h-full w-full min-w-0 max-w-full overflow-hidden bg-slate-50">
      <div className="h-full w-full min-w-0 md:flex">
        <Sidebar variant="sidebar" className="md:top-0 md:h-full md:rounded-none md:border-y-0 md:border-l-0">
          <DashboardSidebar
            activeKey={activeKey}
            onNavigate={(key) => navigate(`/app/${key}`)}
            canManage={canManage}
            canManageUsers={canManageUsers}
            canManageChildren={canManageChildren}
            canManageActivities={canManageActivities}
            canManageLessons={canManageLessons}
            canManageCommunities={canManageCommunities}
            initials={initials}
            fullName={`${session.user.firstName} ${session.user.lastName}`}
            role={session.user.role}
            language={i18n.language}
            onLogout={logout}
            onLanguageChange={(language) => i18n.changeLanguage(language)}
          />
        </Sidebar>

        <SidebarInset className="flex h-full min-w-0 flex-col overflow-hidden px-3 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0">
          <div className="sticky top-0 z-30 -mx-3 border-b border-border bg-white px-3 py-0 shadow-sm md:-mx-6 md:px-6 md:pl-3">
            <div className="flex h-14 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" aria-label="Open menu">
                  <PanelLeft className="h-5 w-5" />
                </SidebarTrigger>
                <button
                  type="button"
                  aria-label="Toggle sidebar"
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:ml-1 md:inline-flex"
                  onClick={() => setOpen(!open)}
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-2">
                <div className="group relative">
                  <button
                    type="button"
                    aria-label={t("messages")}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => openChat()}
                  >
                    <Mail className="h-5 w-5" />
                    {messageIndicator.unreadThreadCount > 0 ? (
                      <span className="absolute -right-0.5 top-0 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                        {messageIndicator.unreadThreadCount}
                      </span>
                    ) : null}
                  </button>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {t("messages")}
                  </span>
                </div>
                <NotificationBellMenu />
                {canReportActivities ? (
                  <Button
                    type="button"
                    className="ml-1 whitespace-nowrap"
                    aria-label={t("reportActivities")}
                    onClick={() => setIsQuickReportOpen(true)}
                  >
                    <ClipboardPenLine className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("reportActivities")}</span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-screen-xl flex-1 flex-col space-y-4 pt-4">
            {activeKey !== "dashboard" ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <House className="h-4 w-4 text-slate-500" />
                <button
                  type="button"
                  className="transition-colors hover:text-slate-900"
                  onClick={() => navigate("/app/dashboard")}
                >
                  {t("dashboard")}
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/15"
                  onClick={() => navigate(`/app/${activeKey}`)}
                >
                  {breadcrumbIcon}
                  <span>{t(selectedSection.labelKey)}</span>
                </button>
              </div>
            ) : null}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [overscroll-behavior-x:none]">
              <Outlet context={context} />
            </div>
          </div>
        </SidebarInset>
      </div>
      <ActivityReportDialog open={isQuickReportOpen} onOpenChange={setIsQuickReportOpen} />
      <DockedChatPanel />
    </div>
  );
}

export function PrivateLayout() {
  const { ready, session } = useSession();
  const location = useLocation();

  if (!ready) return null;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <SidebarProvider>
      <ChatControllerProvider>
        <PrivateLayoutShell />
      </ChatControllerProvider>
    </SidebarProvider>
  );
}
