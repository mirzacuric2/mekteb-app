import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Newspaper,
  LogOut,
  User,
  UserRound,
  Users,
} from "lucide-react";
import { dashboardSections, SectionKey } from "../../features/dashboard/sections";
import { cn } from "../../lib/utils";
import { Select } from "../ui/select";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { useSidebar } from "../ui/sidebar";

type Props = {
  activeKey: SectionKey;
  onNavigate: (key: SectionKey) => void;
  canManage: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  initials: string;
  fullName: string;
  role: string;
  language: string;
  onLogout: () => void;
  onLanguageChange: (language: "en" | "sv" | "bs") => void;
};

export function DashboardSidebar({
  activeKey,
  onNavigate,
  canManage,
  isCollapsed,
  onToggleCollapse,
  initials,
  fullName,
  role,
  language,
  onLogout,
  onLanguageChange,
}: Props) {
  const { t } = useTranslation();
  const { open, isMobile } = useSidebar();
  const isCollapsedDesktop = !open && !isMobile;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const roleLabel = useMemo(() => role.replace("_", " "), [role]);
  const sectionIcons: Record<SectionKey, ReactNode> = {
    posts: <Newspaper className="h-4 w-4 shrink-0" />,
    messages: <MessageSquare className="h-4 w-4 shrink-0" />,
    notifications: <Bell className="h-4 w-4 shrink-0" />,
    users: <Users className="h-4 w-4 shrink-0" />,
    children: <UserRound className="h-4 w-4 shrink-0" />,
    lessons: <BookOpen className="h-4 w-4 shrink-0" />,
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className={`text-xl font-semibold ${!open && !isMobile ? "hidden" : ""}`}>{t("dashboard")}</h1>
            <p className={`text-sm text-slate-500 ${!open && !isMobile ? "hidden" : ""}`}>Mekteb</p>
          </div>
          {!isMobile ? (
            <button
              type="button"
              aria-label="Toggle sidebar"
              className="shrink-0 rounded-md p-1 text-slate-600 hover:bg-slate-100"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarMenu>
            {dashboardSections
              .filter((section) => section.group === "general")
              .map((section) => (
                <SidebarMenuItem key={section.key}>
                  <SidebarMenuButton isActive={activeKey === section.key} onClick={() => onNavigate(section.key)}>
                    <span className="flex items-center gap-2">
                      {sectionIcons[section.key]}
                      {!open && !isMobile ? null : <span>{t(section.labelKey)}</span>}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>

        {canManage ? (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
              {dashboardSections
                .filter(
                  (section) =>
                    section.group === "management" && (canManage || section.key !== "users")
                )
                .map((section) => (
                  <SidebarMenuItem key={section.key}>
                    <SidebarMenuButton isActive={activeKey === section.key} onClick={() => onNavigate(section.key)}>
                      <span className="flex items-center gap-2">
                        {sectionIcons[section.key]}
                        {!open && !isMobile ? null : <span>{t(section.labelKey)}</span>}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
              {dashboardSections
                .filter((section) => section.group === "management" && section.key !== "users")
                .map((section) => (
                  <SidebarMenuItem key={section.key}>
                    <SidebarMenuButton isActive={activeKey === section.key} onClick={() => onNavigate(section.key)}>
                      <span className="flex items-center gap-2">
                        {sectionIcons[section.key]}
                        {!open && !isMobile ? null : <span>{t(section.labelKey)}</span>}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className={`mb-3 space-y-2 ${isCollapsedDesktop ? "hidden" : ""}`}>
          <label className="px-1 text-xs font-medium uppercase tracking-wide text-slate-500">Language</label>
          <Select value={language} onChange={(event) => onLanguageChange(event.target.value as "en" | "sv" | "bs")}>
            <option value="en">English</option>
            <option value="sv">Svenska</option>
            <option value="bs">Bosanski</option>
          </Select>
        </div>

        <div className={cn("relative", isCollapsedDesktop ? "flex justify-center" : "flex justify-start")}>
          <button
            type="button"
            aria-label="Open user options"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white hover:opacity-90"
            onClick={() => setIsUserMenuOpen((value) => !value)}
          >
            {initials}
          </button>

          {isUserMenuOpen ? (
            <div
              className={cn(
                "absolute bottom-12 z-20 w-56 rounded-md border border-border bg-white p-2 shadow-lg",
                isCollapsedDesktop ? "left-12" : "left-0"
              )}
            >
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-slate-700">
                <User className="h-4 w-4 text-slate-500" />
                <span className="truncate font-medium">{fullName}</span>
              </div>
              <p className="px-2 pb-2 text-xs text-slate-500">{roleLabel}</p>
              <button
                type="button"
                className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </SidebarFooter>
    </>
  );
}
