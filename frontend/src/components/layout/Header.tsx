import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useState } from "react";

export function Header({ title }: { title: string }) {
  const { notifications, removeNotification, clearNotifications } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="relative">
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </Button>

        {open && (
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-medium">Live Notifications</span>
              <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs">
                Clear all
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div key={n.id} className="flex items-start gap-2 border-b px-4 py-2 last:border-0">
                    <p className="flex-1 text-xs text-foreground">{n.message}</p>
                    <button onClick={() => removeNotification(n.id)}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
