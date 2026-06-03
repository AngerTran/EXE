/** Types khớp BE DTOs §4.1 (camelCase JSON). */

export type UserRole = "customer" | "admin";

export type SubscriptionPlan = "free" | "student" | "indie" | "pro";

export interface MeWallet {
  balance: number;
  isUnlimited: boolean;
}

export interface MeSubscription {
  plan: SubscriptionPlan;
  status: string;
  expiredAt: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  wallet: MeWallet;
  subscription: MeSubscription;
}

export interface AuthSessionResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string | null;
  };
  requiresEmailConfirmation?: boolean;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  storagePath: string;
  bucket: string;
  expiresInSeconds: number;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
}
