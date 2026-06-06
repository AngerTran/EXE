import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { clearSupabaseLocalSession, getSupabase } from "../../lib/supabase";

function parseHashTokens(): { accessToken?: string; refreshToken?: string; error?: string } {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return {};
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token") ?? undefined,
    refreshToken: params.get("refresh_token") ?? undefined,
    error: params.get("error_description") ?? params.get("error") ?? undefined,
  };
}

export default function AuthCallback() {
  const { completeOAuthSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const supabase = await getSupabase();
        await supabase.auth.initialize();

        let accessToken: string | undefined;
        let refreshToken: string | undefined;

        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          accessToken = data.session?.access_token;
          refreshToken = data.session?.refresh_token ?? undefined;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          accessToken = session?.access_token;
          refreshToken = session?.refresh_token ?? undefined;
        }

        if (!accessToken) {
          const hash = parseHashTokens();
          if (hash.error) throw new Error(hash.error);
          accessToken = hash.accessToken;
          refreshToken = hash.refreshToken;
        }

        if (!accessToken) {
          throw new Error("Không nhận được token từ Google — thử đăng nhập lại.");
        }

        const result = await completeOAuthSession(accessToken, refreshToken);
        await clearSupabaseLocalSession();

        if (cancelled) return;

        if (!result.ok) {
          setError(result.message);
          return;
        }

        navigate(result.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Đăng nhập Google thất bại";
          if (message.includes("PKCE code verifier not found")) {
            setError(
              "Phiên đăng nhập Google hết hạn hoặc bị trùng. Vui lòng quay lại /auth, xóa exe_supabase_auth trong Local Storage (nếu có), rồi thử lại."
            );
          } else {
            setError(message);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [completeOAuthSession, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-destructive text-center max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/auth", { replace: true })}
          className="text-primary hover:underline"
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-muted-foreground">Đang hoàn tất đăng nhập Google...</p>
    </div>
  );
}
