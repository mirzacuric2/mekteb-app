import { Navigate, Route, Routes } from "react-router-dom";
import { VerifyPage } from "./features/auth/verify-page";
import {
  ActivitiesRoute,
  ChildrenRoute,
  CommunitiesRoute,
  DashboardRoute,
  HelpRoute,
  LessonsRoute,
  NotificationsRoute,
  PostsRoute,
  UsersRoute,
} from "./features/dashboard/section-routes";
import { PrivateLayout } from "./layouts/private-layout";
import { PublicLayout } from "./layouts/public-layout";
import { LoginPage } from "./pages/login-page";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>
      <Route path="/app" element={<PrivateLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute />} />
        <Route path="posts" element={<PostsRoute />} />
        <Route path="help" element={<HelpRoute />} />
        <Route path="users" element={<UsersRoute />} />
        <Route path="children" element={<ChildrenRoute />} />
        <Route path="activities" element={<ActivitiesRoute />} />
        <Route path="lessons" element={<LessonsRoute />} />
        <Route path="communities" element={<CommunitiesRoute />} />
        <Route path="notifications" element={<NotificationsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}
