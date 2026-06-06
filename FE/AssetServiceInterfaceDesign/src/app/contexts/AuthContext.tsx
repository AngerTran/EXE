import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, clearAuthTokens, getAccessToken, setAuthTokens } from "../../api/client";
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  mapMeToUser,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  type AppUser,
} from "../../api/auth";
import { fileToAvatarDataUrl } from "../../utils/avatar";
import { clearSupabaseLocalSession, getSupabase } from "../../lib/supabase";
import type { SubscriptionPlan } from "../../api/types/auth";

export type { AppUser as User };
export type SubscriptionType = SubscriptionPlan | null;

export type AuthResult =
  | { ok: true; role: AppUser["role"] }
  | { ok: false; message: string };

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  completeOAuthSession: (accessToken: string, refreshToken?: string | null) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  updateSubscription: (subscription: SubscriptionType, expiry?: string) => void;
  updateProfile: (data: {
    name?: string;
    avatarUrl?: string | null;
    avatarFile?: File;
  }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_credentials") {
      return "Email hoặc mật khẩu không đúng";
    }
    if (error.code === "email_already_exists") {
      return "Email đã được sử dụng";
    }
    if (error.code === "rate_limit_exceeded") {
      return "Quá nhiều lần thử — vui lòng đợi vài phút";
    }
    if (error.code === "account_banned") {
      return "Tài khoản đã bị khóa";
    }
    if (error.code === "configuration_error") {
      return "BE chưa cấu hình Supabase — kiểm tra appsettings";
    }
    if (error.code === "profile_not_found") {
      return "Tài khoản Google chưa có profile — chạy trigger handle_new_user trên Supabase hoặc liên hệ admin";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function hydrateFromToken(): Promise<AppUser | null> {
  if (!getAccessToken()) return null;
  try {
    const me = await fetchMe();
    return mapMeToUser(me);
  } catch {
    clearAuthTokens();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hydrated = await hydrateFromToken();
      if (!cancelled) {
        setUser(hydrated);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(async (accessToken: string, refreshToken?: string | null) => {
    setAuthTokens(accessToken, refreshToken);
    const me = await fetchMe();
    const mapped = mapMeToUser(me);
    setUser(mapped);
    return mapped;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const session = await apiLogin(email, password);
        if (!session.accessToken) {
          return {
            ok: false,
            message: "Đăng nhập thất bại — không nhận được token",
          };
        }
        const mapped = await applySession(session.accessToken, session.refreshToken);
        return { ok: true, role: mapped.role };
      } catch (error) {
        return { ok: false, message: authErrorMessage(error, "Đăng nhập thất bại") };
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      try {
        const session = await apiRegister(email, password, name);
        if (session.requiresEmailConfirmation || !session.accessToken) {
          return {
            ok: false,
            message:
              "Đăng ký thành công — vui lòng xác nhận email trong hộp thư (Supabase) rồi đăng nhập.",
          };
        }
        const mapped = await applySession(session.accessToken, session.refreshToken);
        return { ok: true, role: mapped.role };
      } catch (error) {
        return { ok: false, message: authErrorMessage(error, "Đăng ký thất bại") };
      }
    },
    [applySession]
  );

  const completeOAuthSession = useCallback(
    async (accessToken: string, refreshToken?: string | null): Promise<AuthResult> => {
      try {
        const mapped = await applySession(accessToken, refreshToken);
        return { ok: true, role: mapped.role };
      } catch (error) {
        clearAuthTokens();
        setUser(null);
        return { ok: false, message: authErrorMessage(error, "Đăng nhập Google thất bại") };
      }
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        return { ok: false, message: error.message };
      }
      if (data.url) {
        window.location.assign(data.url);
      }
      return { ok: true, role: "customer" };
    } catch (error) {
      return { ok: false, message: authErrorMessage(error, "Không mở được Google Sign-In") };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearSupabaseLocalSession();
    } catch {
      /* ignore */
    }
    await apiLogout();
    clearAuthTokens();
    setUser(null);
  }, []);

  const updateCredits = useCallback((newCredits: number) => {
    setUser((prev) => (prev ? { ...prev, credits: newCredits } : prev));
  }, []);

  const updateSubscription = useCallback(
    (subscription: SubscriptionType, expiry?: string) => {
      setUser((prev) =>
        prev ? { ...prev, subscription, subscriptionExpiry: expiry } : prev
      );
    },
    []
  );

  const refreshUserData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(mapMeToUser(me));
    } catch {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: {
      name?: string;
      avatarUrl?: string | null;
      avatarFile?: File;
    }) => {
      if (!getAccessToken()) return;

      let me;
      if (data.avatarFile) {
        const avatarUrl = await fileToAvatarDataUrl(data.avatarFile);
        me = await apiUpdateProfile({ avatarUrl });
      } else {
        const patch: { name?: string; avatarUrl?: string | null } = {};
        if (data.name !== undefined) patch.name = data.name;
        if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
        if (Object.keys(patch).length === 0) return;
        me = await apiUpdateProfile(patch);
      }

      setUser(mapMeToUser(me));
    },
    []
  );

  const isAdmin = useCallback(() => user?.role === "admin", [user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        completeOAuthSession,
        logout,
        updateCredits,
        updateSubscription,
        updateProfile,
        refreshUserData,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** URL hiển thị avatar (BE public URL hoặc legacy base64). */
export function getUserAvatarSrc(user: AppUser | null | undefined): string | undefined {
  if (!user) return undefined;
  return user.avatarUrl;
}
