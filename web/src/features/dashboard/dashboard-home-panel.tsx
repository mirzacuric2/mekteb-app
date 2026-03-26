import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ProgressOverviewCards } from "./progress-overview-cards";
import { ProgressChildDetailsDrawer } from "./progress-child-details-drawer";
import { useRoleAccess } from "../auth/use-role-access";
import { useTranslation } from "react-i18next";
import { DASHBOARD_RECENT_POSTS_LIMIT } from "../posts/constants";
import { usePostsQuery } from "../posts/use-posts-data";
import { useSession } from "../auth/session-context";
import { CommunityEventsPanel } from "../events/community-events-panel";
import { useChildByIdQuery } from "../children/use-children-data";
import {
  CHILD_DRAWER_TAB_QUERY_KEY,
  DASHBOARD_CHILD_ID_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
  type ChildDrawerTab,
} from "./child-drawer-tab.constants";

export function DashboardHomePanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const posts = usePostsQuery({ limit: DASHBOARD_RECENT_POSTS_LIMIT }, true);
  const { isParent, isAdmin, isUser, isBoardMember } = useRoleAccess();
  const canSeeProgressDashboard = isParent || isAdmin || isUser || isBoardMember;
  const dashboardCommunityId = session?.user.communityId ?? null;
  const showDashboardCommunityEvents = Boolean(dashboardCommunityId && canSeeProgressDashboard);
  const recentPosts = posts.data || [];

  const dashboardChildId = searchParams.get(DASHBOARD_CHILD_ID_QUERY_KEY)?.trim() || null;
  const dashboardChildQuery = useChildByIdQuery(dashboardChildId ?? undefined, true, Boolean(dashboardChildId));

  const closeDashboardChildDrawer = () => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete(DASHBOARD_CHILD_ID_QUERY_KEY);
        p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
        return p;
      },
      { replace: true }
    );
  };

  const openChildInDashboardDrawer = (childId: string, tab: ChildDrawerTab) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set(DASHBOARD_CHILD_ID_QUERY_KEY, childId);
        if (tab === DEFAULT_CHILD_DRAWER_TAB) p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
        else p.set(CHILD_DRAWER_TAB_QUERY_KEY, tab);
        return p;
      },
      { replace: true }
    );
  };

  return (
    <div className="space-y-3">
      {canSeeProgressDashboard ? (
        <ProgressOverviewCards enabled onOpenChildInDrawer={openChildInDashboardDrawer} />
      ) : null}
      {showDashboardCommunityEvents && dashboardCommunityId ? (
        <Card className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <CommunityEventsPanel
            communityId={dashboardCommunityId}
            canManageEvents={false}
            forceWeekly
            hoverActionsForDesktop={false}
            dashboardPreview
            showParentWeekSummary
          />
        </Card>
      ) : null}
      <Card className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{t("dashboardRecentPostsTitle")}</h3>
        {recentPosts.length ? (
          <ul className="mt-2 space-y-2">
            {recentPosts.map((post) => (
              <li key={post.id} className="rounded-md border border-border bg-slate-50/60 p-2.5">
                <p className="text-sm font-medium text-slate-900">{post.title}</p>
                <p className="mt-1 text-sm text-slate-600">{post.content}</p>
                <p className="mt-1 text-xs text-slate-500">{post.author ? `${post.author.firstName} ${post.author.lastName}` : "Imam"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t("dashboardRecentPostsEmpty")}</p>
        )}
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-auto border-0 bg-transparent p-0 text-primary enabled:hover:bg-transparent enabled:hover:underline"
            onClick={() => navigate("/app/posts")}
          >
            {t("dashboardRecentPostsViewAll")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <ProgressChildDetailsDrawer
        open={Boolean(dashboardChildId)}
        onOpenChange={(open) => {
          if (!open) closeDashboardChildDrawer();
        }}
        child={dashboardChildQuery.data ?? null}
        isLoading={dashboardChildQuery.isLoading}
        childrenFetchMineOnly
        syncTabToSearchParams
      />
    </div>
  );
}
