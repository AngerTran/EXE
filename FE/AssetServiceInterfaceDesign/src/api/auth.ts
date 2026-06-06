import { apiRequest } from "./client";
import type {
  AuthSessionResponse,
  MeResponse,
  SubscriptionPlan,
  UploadUrlResponse,
  UserRole,
} from "./types/auth";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  credits: number;
  isUnlimited: boolean;
  role: UserRole;
  subscription: SubscriptionPlan | null;
  subscriptionExpiry?: string;
  avatarUrl?: string;
}

export function mapMeToUser(me: MeResponse): AppUser {
  const plan = me.subscription?.plan ?? "free";
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    credits: me.wallet?.balance ?? 0,
    isUnlimited: me.wallet?.isUnlimited ?? false,
    role: (me.role === "admin" ? "admin" : "customer") as UserRole,
    subscription: plan as SubscriptionPlan,
    subscriptionExpiry: me.subscription?.expiredAt ?? undefined,
    avatarUrl: me.avatarUrl ?? undefined,
  };
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>("/auth/register", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>("/auth/login", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  } catch {
    // Token hết hạn vẫn xóa local
  }
}

export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me");
}

export async function updateProfile(patch: {
  name?: string;
  avatarUrl?: string | null;
}): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  return apiRequest<void>("/auth/forgot-password", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function uploadAvatar(file: File): Promise<MeResponse> {
  const meta = await apiRequest<UploadUrlResponse>("/auth/me/avatar/upload-url", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
    }),
  });

  const put = await fetch(meta.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!put.ok) {
    throw new Error(
      put.status === 403 || put.status === 401
        ? "Upload avatar thất bại — kiểm tra Supabase Storage (ServiceRoleKey, bucket avatars)."
        : `Upload avatar thất bại (${put.status})`
    );
  }

  return apiRequest<MeResponse>("/auth/me/avatar", {
    method: "POST",
    body: JSON.stringify({ storagePath: meta.storagePath }),
  });
}
