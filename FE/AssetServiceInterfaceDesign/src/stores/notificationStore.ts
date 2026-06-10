import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationApiItem,
} from "../api/notifications";
import { getAccessToken } from "../api/client";
import type { AppNotification, AppNotificationType } from "../types/notification";

const MAX_ITEMS = 80;

type Listener = () => void;

let items: AppNotification[] = [];
let loading = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

function mapApiItem(n: NotificationApiItem): AppNotification {
  return {
    id: n.id,
    type: n.type as AppNotificationType,
    title: n.title,
    description: n.description ?? undefined,
    createdAt: n.createdAt,
    read: n.read,
    actionUrl: n.actionUrl ?? undefined,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

function isServerId(id: string): boolean {
  return UUID_RE.test(id);
}

function mergeItems(server: AppNotification[], local: AppNotification[]): AppNotification[] {
  const seen = new Set(server.map((n) => n.id));
  const extras = local.filter((n) => !seen.has(n.id));
  return [...server, ...extras]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ITEMS);
}

export const notificationStore = {
  getItems(): AppNotification[] {
    return items;
  },

  isLoading(): boolean {
    return loading;
  },

  getUnreadCount(): number {
    return items.filter((n) => !n.read).length;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async refreshFromApi(): Promise<void> {
    if (!isLoggedIn()) return;
    loading = true;
    emit();
    try {
      const res = await fetchNotifications({ page: 1, pageSize: MAX_ITEMS });
      const serverItems = res.data.map(mapApiItem);
      const localOnly = items.filter((n) => !isServerId(n.id));
      items = mergeItems(serverItems, localOnly);
      emit();
    } catch {
      /* giữ danh sách cũ nếu BE lỗi */
    } finally {
      loading = false;
      emit();
    }
  },

  /** Ghi thông báo vào chuông — luôn hiển thị trong panel (không popup toast). */
  push(input: {
    type: AppNotificationType;
    title: string;
    description?: string;
    actionUrl?: string;
    id?: string;
  }): AppNotification {
    const entry: AppNotification = {
      id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: input.type,
      title: input.title,
      description: input.description,
      actionUrl: input.actionUrl,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const withoutDup = items.filter((n) => n.id !== entry.id);
    items = [entry, ...withoutDup].slice(0, MAX_ITEMS);
    emit();
    return entry;
  },

  /** Thay thế danh sách ephemeral (vd. đơn chờ admin) — giữ thông báo từ server/local khác. */
  setEphemeral(prefix: string, next: AppNotification[]) {
    const kept = items.filter((n) => !n.id.startsWith(prefix));
    items = mergeItems(kept, next);
    emit();
  },

  async markAllRead(): Promise<void> {
    if (isLoggedIn()) {
      try {
        await markAllNotificationsRead();
      } catch {
        /* fallback local */
      }
    }
    if (items.every((n) => n.read)) return;
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },

  async markRead(id: string): Promise<void> {
    if (isLoggedIn() && isServerId(id)) {
      try {
        await markNotificationRead(id);
      } catch {
        /* fallback local */
      }
    }
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    emit();
  },

  async clearAll(): Promise<void> {
    if (isLoggedIn()) {
      try {
        await deleteAllNotifications();
      } catch {
        /* fallback local */
      }
    }
    if (items.length === 0) return;
    items = [];
    emit();
  },

  reset() {
    items = [];
    emit();
  },
};
