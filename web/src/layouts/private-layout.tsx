import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  House,
  MessageSquare,
  Newspaper,
  UserRound,
  Users,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { DashboardSidebar } from "../components/layout/dashboard-sidebar";
import { dashboardSections, isSectionKey, SectionKey } from "../features/dashboard/sections";
import { useSession } from "../features/auth/session-context";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "../components/ui/sidebar";
import { PrivateLayoutContext } from "./private-layout-context";

function PrivateLayoutShell() {
  const { t, i18n } = useTranslation();
  const { session, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { open, setOpen, setOpenMobile } = useSidebar();
  const currentSegment = location.pathname.split("/").pop() || "posts";
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSectionKey(currentSegment)) {
      navigate("/app/posts", { replace: true });
      return;
    }
    if (!canManage && currentSegment === "users") {
      navigate("/app/posts", { replace: true });
      return;
    }
    setOpenMobile(false);
  }, [canManage, currentSegment, navigate, setOpenMobile]);

  if (!session) return null;

  const activeKey: SectionKey = isSectionKey(currentSegment) ? currentSegment : "posts";
  const selectedSection = dashboardSections.find((section) => section.key === activeKey) ?? dashboardSections[0];
  const breadcrumbIcon = {
    posts: <Newspaper className="h-4 w-4 text-slate-500" />,
    messages: <MessageSquare className="h-4 w-4 text-slate-500" />,
    notifications: <Bell className="h-4 w-4 text-slate-500" />,
    users: <Users className="h-4 w-4 text-slate-500" />,
    children: <UserRound className="h-4 w-4 text-slate-500" />,
    lessons: <BookOpen className="h-4 w-4 text-slate-500" />,
  }[activeKey];
  const initials = `${session.user.firstName[0] ?? ""}${session.user.lastName[0] ?? ""}`.toUpperCase();

  const context = useMemo<PrivateLayoutContext>(
    () => ({
      canManage,
      canCreateAdmin: session.user.role === "SUPER_ADMIN",
    }),
    [canManage, session.user.role]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <div className="flex w-full min-w-0">
        <Sidebar variant="sidebar" className="md:top-0 md:h-screen md:rounded-none md:border-y-0 md:border-l-0">
          <DashboardSidebar
            activeKey={activeKey}
            onNavigate={(key) => navigate(`/app/${key}`)}
            canManage={canManage}
            isCollapsed={!open}
            onToggleCollapse={() => setOpen(!open)}
            initials={initials}
            fullName={`${session.user.firstName} ${session.user.lastName}`}
            role={session.user.role}
            language={i18n.language}
            onLogout={logout}
            onLanguageChange={(language) => i18n.changeLanguage(language)}
          />
        </Sidebar>

        <SidebarInset className="w-full overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto w-full min-w-0 max-w-[1120px] space-y-4 xl:w-[1120px]">
            <Card className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden">
                  Menu
                </SidebarTrigger>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <House className="h-4 w-4 text-slate-500" />
                  <button
                    type="button"
                    className="transition-colors hover:text-slate-900"
                    onClick={() => navigate("/app/posts")}
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
              </div>
            </Card>
            <div className="min-w-0 overflow-x-hidden">
              <Outlet context={context} />
            </div>
          </div>
        </SidebarInset>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        Chat
      </button>
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
      <PrivateLayoutShell />
    </SidebarProvider>
  );
}
