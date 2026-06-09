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

export interface AdminUserDetail {
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
  orderCount: number;
  assetCount: number;
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

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gameIdea?: string | null;
  consultType: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AdminOrderTypeStat {
  orderType: string;
  count: number;
}

export interface AdminPurchaseStat {
  category: string;
  itemName: string;
  planSlug?: string | null;
  count: number;
  revenueVnd: number;
}

export interface AdminAnalyticsOrders {
  totalOrders: number;
  byStatus: AdminOrderStatusStat[];
  byType: AdminOrderTypeStat[];
  purchasesByPlan: AdminPurchaseStat[];
}

export interface AdminAiDailyUsage {
  date: string;
  messages: number;
  tokens: number;
  xuCharged: number;
}

export interface AdminAiUserUsageStat {
  userId: string;
  userName: string;
  email: string;
  messageCount: number;
  totalTokens: number;
  totalXuCharged: number;
}

export interface AdminAnalyticsAiUsage {
  totalMessages: number;
  totalTokens: number;
  totalXuCharged: number;
  activeSessions: number;
  byDay: AdminAiDailyUsage[];
  byUser: AdminAiUserUsageStat[];
}
