import { Navigate, Route, Routes } from "react-router-dom";
import { VerifyPage } from "./features/auth/verify-page";
import {
  ChildrenRoute,
  HelpRoute,
  LessonsRoute,
  MessagesRoute,
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
        <Route index element={<Navigate to="posts" replace />} />
        <Route path="posts" element={<PostsRoute />} />
        <Route path="help" element={<HelpRoute />} />
        <Route path="users" element={<UsersRoute />} />
        <Route path="children" element={<ChildrenRoute />} />
        <Route path="lessons" element={<LessonsRoute />} />
        <Route path="messages" element={<MessagesRoute />} />
        <Route path="notifications" element={<NotificationsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/posts" replace />} />
    </Routes>
  );
}
