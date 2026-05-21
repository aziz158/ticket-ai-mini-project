import { create } from "zustand";
import type { Notification } from "@/types";

interface AppStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useStore = create<AppStore>((set) => ({
  notifications: [],

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: crypto.randomUUID(), timestamp: Date.now() },
        ...state.notifications,
      ].slice(0, 50),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
