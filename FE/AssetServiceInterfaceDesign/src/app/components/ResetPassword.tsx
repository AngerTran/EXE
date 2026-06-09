import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppLogo } from "./AppLogo";
import { BeamPanel } from "./BeamPanel";
import authHero from "../../assets/auth-hero.png";
import { resetPassword } from "../../api/auth";
import { ApiError } from "../../api/client";
import { toast } from "../../utils/notify";

function parseHashParams(): Record<string, string> {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return {};
  return Object.fromEntries(new URLSearchParams(hash));
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = parseHashParams();

    if (params.error || params.error_code) {
      const desc = params.error_description?.replace(/\+/g, " ");
      if (params.error_code === "otp_expired") {
        setError(
          "Link reset đã hết hạn hoặc đã được dùng. Vui lòng gửi lại email tại trang Quên mật khẩu."
        );
      } else {
        setError(desc || "Không mở được link reset. Thử gửi lại email.");
      }
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    const token = params.access_token;
    const type = params.type;

    if (token && (!type || type === "recovery")) {
      setAccessToken(token);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    setError("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Yêu cầu gửi lại email.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await resetPassword(accessToken, password);
      setSuccess(true);
      toast.success("Đã đổi mật khẩu", {
        description: "Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
      setTimeout(() => navigate("/auth"), 1200);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không đổi được mật khẩu — link có thể đã hết hạn"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-shell relative flex flex-col selection:bg-[#d0bcff]/30">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#8b5cf6]/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] rounded-full bg-[#4cd7f6]/12 blur-[100px]" />
      </div>

      <main className="auth-shell flex flex-1 flex-col md:flex-row w-full overflow-hidden relative">
        <div className="absolute inset-0 auth-grid-bg opacity-25 pointer-events-none" />

        <section className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden bg-[#171f33] min-h-0">
          <div className="absolute inset-0 z-0">
            <img
              src={authHero}
              alt="Studio game developer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 auth-hero-vignette" />
            <div className="absolute inset-0 auth-hero-overlay-bottom" />
            <div className="absolute inset-0 auth-hero-overlay-side" />
          </div>
          <div className="relative z-10 px-8 lg:px-12 text-center w-full max-w-md flex flex-col items-center">
            <AppLogo size="lg" className="mb-4" />
            <p className="auth-body text-base text-[#cbc3d7] max-w-sm mx-auto leading-relaxed">
              Đặt lại mật khẩu để tiếp tục sáng tạo với trung tâm assets của bạn.
            </p>
          </div>
        </section>

        <section className="auth-form-panel flex-1 md:w-1/2 bg-[#131b2e] flex flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-12 py-8 md:py-10 relative z-20 min-h-0 overflow-y-auto overscroll-contain">
          <div className="md:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center">
              <AppLogo size="md" />
            </Link>
          </div>

          <BeamPanel className="w-full max-w-[var(--auth-form-max)] mx-auto auth-glass-card auth-hud-frame relative p-6 lg:p-8" beam={3.6}>
            <header className="auth-form-header mb-6 text-center md:text-left">
              <h2 className="auth-headline text-2xl lg:text-[1.75rem] text-[#dae2fd] mb-2">
                Đặt lại mật khẩu
              </h2>
              <p className="auth-body text-sm text-[#cbc3d7]">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="auth-form-stack flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {accessToken && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="auth-label text-xs">
                      Mật khẩu mới
                    </label>
                    <div className="auth-neon-glow auth-input-surface relative flex items-center rounded-md transition-all">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#958ea0]" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="auth-input-field w-full bg-transparent border-none pl-10 pr-12 text-[#dae2fd] placeholder:text-[#958ea0]/60 focus:ring-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#958ea0] hover:text-[#dae2fd] transition-colors"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="auth-label text-xs">
                      Xác nhận mật khẩu
                    </label>
                    <div className="auth-neon-glow auth-input-surface relative flex items-center rounded-md transition-all">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#958ea0]" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="auth-input-field w-full bg-transparent border-none pl-10 pr-4 text-[#dae2fd] placeholder:text-[#958ea0]/60 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="auth-btn-primary group w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Thành công!
                      </>
                    ) : (
                      <>
                        Lưu mật khẩu mới
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              )}

              {!accessToken && (
                <Link
                  to="/auth"
                  className="auth-btn-secondary w-full flex items-center justify-center py-3 rounded-full text-[#dae2fd] border border-white/10 hover:border-[#4cd7f6]/40 transition-all text-sm font-semibold"
                >
                  Quay lại đăng nhập
                </Link>
              )}
            </form>

            <footer className="mt-6 text-center">
              <Link
                to="/auth"
                className="text-sm text-[#d0bcff] font-bold hover:underline"
              >
                ← Quay lại đăng nhập
              </Link>
            </footer>
          </BeamPanel>
        </section>
      </main>
    </div>
  );
}
