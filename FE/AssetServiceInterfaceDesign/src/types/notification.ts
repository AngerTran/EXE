export type AppNotificationType = "success" | "error" | "warning" | "info";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  description?: string;
  actionUrl?: string;
  createdAt: string;
  read: boolean;
};
