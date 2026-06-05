export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalAssets: number;
  pendingAssets: number;
  totalOrders: number;
  revenueVnd: number;
  totalDownloads: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  status: string;
  walletBalance: number;
  subscriptionPlan?: string | null;
  totalSpentVnd: number;
  createdAt: string;
}

export interface AdminDailyCount {
  date: string;
  count: number;
}

export interface AdminAnalyticsRevenue {
  totalRevenueVnd: number;
  byDay: AdminDailyCount[];
}

export interface AdminAnalyticsUsers {
  totalUsers: number;
  registrationsByDay: AdminDailyCount[];
}

export interface AdminCategoryStat {
  categoryId: string;
  categoryName: string;
  assetCount: number;
  downloadCount: number;
}

export interface AdminAnalyticsAssets {
  totalAssets: number;
  totalDownloads: number;
  byCategory: AdminCategoryStat[];
}

export interface AdminOrderStatusStat {
  status: string;
  count: number;
}

export interface AdminAnalyticsOrders {
  totalOrders: number;
  byStatus: AdminOrderStatusStat[];
}
