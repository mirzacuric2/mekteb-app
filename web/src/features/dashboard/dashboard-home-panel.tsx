import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuthedQuery } from "../common/use-authed-query";
import { ProgressOverviewCards } from "./progress-overview-cards";
import { useRoleAccess } from "../auth/use-role-access";
import { ROLE } from "../../types";
import { useTranslation } from "react-i18next";

type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

type DashboardPost = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author?: PostAuthor | null;
};

const RECENT_POSTS_LIMIT = 3;

export function DashboardHomePanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const posts = useAuthedQuery<DashboardPost[]>("posts", "/posts", true);
  const { isParent, isAdmin, isUser, isBoardMember } = useRoleAccess();
  const canSeeProgressDashboard = isParent || isAdmin || isUser || isBoardMember;
  const imamPosts = (posts.data || []).filter((post) => post.author?.role === ROLE.ADMIN).slice(0, RECENT_POSTS_LIMIT);

  return (
    <div className="space-y-3">
      {canSeeProgressDashboard ? <ProgressOverviewCards enabled /> : null}
      <Card className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{t("dashboardRecentPostsTitle")}</h3>
          <Button variant="outline" onClick={() => navigate("/app/posts")}>
            {t("dashboardRecentPostsViewAll")}
          </Button>
        </div>
        {imamPosts.length ? (
          <ul className="mt-2 space-y-2">
            {imamPosts.map((post) => (
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
      </Card>
    </div>
  );
}
