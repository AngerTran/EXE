import type { AppNotification, AppNotificationType } from "../types/notification";

const MAX_ITEMS = 80;

type Listener = () => void;

let items: AppNotification[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export const notificationStore = {
  getItems(): AppNotification[] {
    return items;
  },

  getUnreadCount(): number {
    return items.filter((n) => !n.read).length;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  push(input: {
    type: AppNotificationType;
    title: string;
    description?: string;
  }): AppNotification {
    const entry: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: input.type,
      title: input.title,
      description: input.description,
      createdAt: new Date().toISOString(),
      read: false,
    };
    items = [entry, ...items].slice(0, MAX_ITEMS);
    emit();
    return entry;
  },

  markAllRead() {
    if (items.every((n) => n.read)) return;
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },

  markRead(id: string) {
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    emit();
  },

  clearAll() {
    if (items.length === 0) return;
    items = [];
    emit();
  },
};
