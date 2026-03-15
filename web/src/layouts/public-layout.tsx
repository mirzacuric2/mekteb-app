import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <Outlet />
    </div>
  );
}
