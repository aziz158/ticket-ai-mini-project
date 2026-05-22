import { NavLink } from "react-router-dom";
import { BarChart3, Bell, Bot, LayoutDashboard, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tickets", icon: Ticket, label: "Ticket Queue" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function Sidebar() {
  const notifications = useStore((s) => s.notifications);
  const unread = notifications.length;

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Bot className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Ticket AI</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>Live alerts</span>
          {unread > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
