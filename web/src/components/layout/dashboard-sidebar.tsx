import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Bell,
  BookOpen,
  Building2,
  CircleHelp,
  Newspaper,
  LogOut,
  LayoutDashboard,
  User,
  UserRound,
  Users,
} from "lucide-react";
import { dashboardSections, SectionKey } from "../../features/dashboard/sections";
import { cn } from "../../lib/utils";
import { LanguageSwitcher } from "../common/language-switcher";
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
  canManageUsers: boolean;
  canManageChildren: boolean;
  canManageActivities: boolean;
  canManageLessons: boolean;
  canManageCommunities: boolean;
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
  canManageUsers,
  canManageChildren,
  canManageActivities,
  canManageLessons,
  canManageCommunities,
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
  const fullLogoSrc = "/branding/izbus-logo.png";
  const compactLogoSrc = "/branding/logo-small.svg";
  const shouldUseCompactLogo = !isMobile && !open;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const roleLabel = useMemo(() => role.replace("_", " "), [role]);
  const sectionIcons: Record<SectionKey, ReactNode> = {
    dashboard: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    posts: <Newspaper className="h-4 w-4 shrink-0" />,
    help: <CircleHelp className="h-4 w-4 shrink-0" />,
    notifications: <Bell className="h-4 w-4 shrink-0" />,
    users: <Users className="h-4 w-4 shrink-0" />,
    children: <UserRound className="h-4 w-4 shrink-0" />,
    activities: <ClipboardList className="h-4 w-4 shrink-0" />,
    lessons: <BookOpen className="h-4 w-4 shrink-0" />,
    communities: <Building2 className="h-4 w-4 shrink-0" />,
  };

  return (
    <>
      <SidebarHeader>
        <div className="-mx-4 px-4">
          <div className="flex h-14 items-center justify-center">
            <button
              type="button"
              aria-label="Go to dashboard"
              className={cn(
                "inline-flex items-center rounded-md transition-opacity hover:opacity-90",
                shouldUseCompactLogo ? "justify-center" : "justify-center px-1 py-1"
              )}
              onClick={() => onNavigate("dashboard")}
            >
              <img
                src={shouldUseCompactLogo ? compactLogoSrc : fullLogoSrc}
                alt="Mekteb logo"
                className={cn(
                  "object-contain",
                  shouldUseCompactLogo ? "h-10 w-10" : "h-11 w-auto max-w-[172px]"
                )}
              />
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("general")}</SidebarGroupLabel>
          <SidebarMenu>
            {dashboardSections
              .filter((section) => section.group === "general" && section.key !== "notifications")
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

        <div className={cn(isCollapsedDesktop ? "mt-2 border-t border-border pt-2" : "")}>
          {canManage ? (
            <SidebarGroup>
              <SidebarGroupLabel>{t("management")}</SidebarGroupLabel>
              <SidebarMenu>
                {dashboardSections
                  .filter(
                    (section) =>
                      section.group === "management" &&
                      ((section.key === "users" && canManageUsers) ||
                        (section.key === "children" && canManageChildren) ||
                        (section.key === "activities" && canManageActivities) ||
                        (section.key === "communities" && canManageCommunities) ||
                        (section.key === "lessons" && canManageLessons))
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
              <SidebarGroupLabel>{t("management")}</SidebarGroupLabel>
              <SidebarMenu>
                {dashboardSections
                  .filter(
                    (section) =>
                      section.group === "management" &&
                      ((section.key === "children" && canManageChildren) ||
                        (section.key === "activities" && canManageActivities) ||
                        (section.key === "communities" && canManageCommunities) ||
                        (section.key === "lessons" && canManageLessons))
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
          )}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className={cn("mb-3 space-y-2", isCollapsedDesktop ? "flex flex-col items-center" : "")}>
          <LanguageSwitcher
            value={language as "en" | "sv" | "bs"}
            onChange={onLanguageChange}
            compact={isCollapsedDesktop}
            fullWidth={!isCollapsedDesktop}
            className={isCollapsedDesktop ? "justify-center" : "w-full"}
          />
        </div>

        <div
          className={cn(
            "relative flex items-center gap-2",
            isCollapsedDesktop ? "flex-col justify-center" : "w-full"
          )}
        >
          <button
            type="button"
            aria-label="Open user options"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white hover:opacity-90"
            onClick={() => setIsUserMenuOpen((value) => !value)}
          >
            {initials}
          </button>
          {isCollapsedDesktop ? null : (
            <div className="group relative ml-auto">
              <button
                type="button"
                aria-label="Open help"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700",
                  activeKey === "help" ? "bg-primary/10 text-primary" : ""
                )}
                onClick={() => onNavigate("help")}
              >
                <CircleHelp className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {t("help")}
              </span>
            </div>
          )}

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
                <span>{t("logout")}</span>
              </button>
            </div>
          ) : null}
        </div>
      </SidebarFooter>
    </>
  );
}
