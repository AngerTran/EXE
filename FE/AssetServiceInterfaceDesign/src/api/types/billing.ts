export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  priceVnd: number;
  creditsMonthly?: number | null;
  isUnlimited: boolean;
  features: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface SubscriptionMe {
  planSlug?: string | null;
  planName?: string | null;
  status: string;
  startedAt?: string | null;
  expiredAt?: string | null;
  isUnlimited: boolean;
  creditsMonthly?: number | null;
}

export interface SubscriptionHistoryItem {
  id: string;
  planSlug: string;
  planName: string;
  status: string;
  startedAt: string;
  expiredAt?: string | null;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}
