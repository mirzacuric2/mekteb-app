import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="h-full min-h-0 w-full overflow-x-hidden overflow-y-auto">
      <Outlet />
    </div>
  );
}
