import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tickets": "Ticket Queue",
  "/analytics": "Analytics",
};

export function Layout() {
  const location = useLocation();
  const base = "/" + location.pathname.split("/")[1];
  const title = TITLES[base] ?? "Ticket Details";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
