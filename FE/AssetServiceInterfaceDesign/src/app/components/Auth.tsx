import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import authHero from "../../assets/auth-hero.png";
import { toast } from "sonner";
import { forgotPassword } from "../../api/auth";
import { ApiError, getRememberMePreference, setRememberMePreference } from "../../api/client";
import { getSupabase } from "../../lib/supabase";

type AuthView = "login" | "register" | "forgot";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.38z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.13l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"
        fill="currentColor"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M19.27 4.58c-1.3-.6-2.75-1.05-4.28-1.3l-.21.45c-1.72-.26-3.45-.26-5.16 0l-.21-.45c-1.53.25-2.98.7-4.28 1.3C2.49 8.54 1.36 12.39 2 16.19c2.1 1.54 4.14 2.48 6.14 3.09.5-.68.94-1.41 1.31-2.18-.71-.27-1.39-.61-2.03-1.01.17-.12.33-.26.49-.39 3.93 1.81 8.2 1.81 12.13 0 .16.13.32.27.49.39-.64.4-1.32.74-2.03 1.01.37.77.81 1.5 1.31 2.18 2-.61 4.04-1.55 6.14-3.09.73-4.73-.55-8.52-2.72-11.61zM9.1 14.25c-.9 0-1.64-.83-1.64-1.84s.71-1.84 1.64-1.84c.93 0 1.67.83 1.67 1.84s-.73 1.84-1.67 1.84zm5.8 0c-.9 0-1.64-.83-1.64-1.84s.71-1.84 1.64-1.84c.93 0 1.67.83 1.67 1.84s-.74 1.84-1.67 1.84z"
        fill="currentColor"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 .3a12.1 12.1 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.3-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12.1 12.1 0 0 0 12 .3z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const isLogin = view === "login";
  const isForgot = view === "forgot";
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(getRememberMePreference);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void getSupabase();
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.ok) {
        setError(result.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    let didSucceed = false;

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password, rememberMe);
        if (result.ok) {
          didSucceed = true;
          setSuccess(true);
          setTimeout(() => {
            navigate(result.role === "admin" ? "/admin" : "/dashboard");
          }, 600);
        } else {
          setError(result.message);
        }
      } else {
        if (!formData.name.trim()) {
          setError("Vui lòng nhập tên của bạn");
          return;
        }
        const result = await register(formData.email, formData.password, formData.name);
        if (result.ok) {
          didSucceed = true;
          setSuccess(true);
          setTimeout(() => {
            navigate(result.role === "admin" ? "/admin" : "/dashboard");
          }, 600);
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError("Không kết nối được BE — chạy API tại http://localhost:5180");
    } finally {
      if (!didSucceed) setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();
    if (!email) {
      setError("Vui lòng nhập email đã đăng ký");
      return;
    }
    setError("");
    setLoading(true);
    setSuccess(false);
    try {
      await forgotPassword(email);
      setSuccess(true);
      toast.success("Đã gửi email đặt lại mật khẩu", {
        description:
          "Kiểm tra hộp thư. Link qua BE (5180) rồi về localhost:5173 — thêm redirect URL BE trong Supabase nếu cần.",
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không gửi được email — kiểm tra BE và cấu hình Supabase Auth"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleMode = () => {
    setView((v) => (v === "login" ? "register" : "login"));
    setError("");
    setSuccess(false);
    setFormData({ email: formData.email, password: "", name: "" });
  };

  const openForgot = () => {
    setView("forgot");
    setError("");
    setSuccess(false);
    setFormData((prev) => ({ ...prev, password: "", name: "" }));
  };

  const backToLogin = () => {
    setView("login");
    setError("");
    setSuccess(false);
  };

  return (
    <div className="auth-page auth-shell relative flex flex-col selection:bg-[#d0bcff]/30">
      {/* Ambient glow — purple + cyan per brand */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#8b5cf6]/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] rounded-full bg-[#4cd7f6]/12 blur-[100px]" />
      </div>

      <main className="auth-shell flex flex-1 flex-col md:flex-row w-full overflow-hidden relative">
        <div className="absolute inset-0 auth-grid-bg opacity-25 pointer-events-none" />

        {/* Left: hero image + branding — ~52% width on desktop */}
        <section className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden bg-[#171f33] min-h-0">
          <div className="absolute inset-0 z-0">
            <img
              src={authHero}
              alt="Studio game developer tương lai — màn hình 3D, code và ánh sáng neon"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 auth-hero-vignette" />
            <div className="absolute inset-0 auth-hero-overlay-bottom" />
            <div className="absolute inset-0 auth-hero-overlay-side" />
          </div>
          <div className="relative z-10 px-8 lg:px-12 text-center w-full max-w-md">
            <h1 className="auth-display text-4xl lg:text-[2.75rem] text-[#d0bcff] mb-3 drop-shadow-[0_0_24px_rgba(139,92,246,0.35)]">
              GameAssets AI
            </h1>
            <p className="auth-body text-base text-[#cbc3d7] max-w-sm mx-auto leading-relaxed">
              Làm chủ tương lai game dev. Thiết kế, tạo và triển khai assets chất lượng cao với sức mạnh AI.
            </p>
            <div className="auth-hero-stats mt-10 flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="auth-headline text-2xl text-[#4cd7f6] auth-code">500k+</span>
                <span className="auth-label mt-1 opacity-70">Assets gợi ý</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="auth-headline text-2xl text-[#4edea3] auth-code">10</span>
                <span className="auth-label mt-1 opacity-70">Xu miễn phí</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: form — fills remaining width */}
        <section className="auth-form-panel flex-1 md:w-1/2 bg-[#131b2e] flex flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-12 py-8 md:py-10 relative z-20 min-h-0 overflow-y-auto overscroll-contain">
          <div className="md:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-[#4cd7f6] auth-headline text-xl">
              <Sparkles className="w-6 h-6 text-[#d0bcff]" />
              GameAssets AI
            </Link>
          </div>

          <div className="w-full max-w-[var(--auth-form-max)] mx-auto">
            <header className="auth-form-header mb-6 text-center md:text-left">
              <h2 className="auth-headline text-2xl lg:text-[1.75rem] text-[#dae2fd] mb-2">
                {isForgot ? "Quên mật khẩu" : isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
              </h2>
              <p className="auth-body text-sm text-[#cbc3d7]">
                {isForgot
                  ? "Nhập email đã đăng ký — Supabase sẽ gửi link đặt lại mật khẩu."
                  : isLogin
                    ? "Nhập thông tin để vào trung tâm sáng tạo của bạn."
                    : "Đăng ký và nhận 100 xu miễn phí ngay hôm nay."}
              </p>
            </header>

            {/* Social (Google only) */}
            {isLogin && !isForgot && (
              <>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="auth-btn-secondary w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[#dae2fd] hover:bg-white/5 border border-white/10 hover:border-[#4cd7f6]/40 transition-all disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="text-sm font-semibold">
                      {googleLoading ? "Đang chuyển sang Google..." : "Tiếp tục với Google"}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="auth-label opacity-50 normal-case tracking-widest">
                    hoặc tiếp tục với email
                  </span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
              </>
            )}

            <form
              onSubmit={isForgot ? handleForgotPassword : handleSubmit}
              className="auth-form-stack flex flex-col gap-4"
            >
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {!isLogin && !isForgot && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="auth-label text-xs">
                    Tên của bạn
                  </label>
                  <div className="auth-neon-glow auth-input-surface relative flex items-center rounded-md transition-all">
                    <User className="absolute left-3.5 w-4 h-4 text-[#958ea0]" />
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nguyễn Văn A"
                      className="auth-input-field w-full bg-transparent border-none pl-10 pr-4 text-[#dae2fd] placeholder:text-[#958ea0]/60 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="auth-label text-xs">
                  Email
                </label>
                <div className="auth-neon-glow auth-input-surface relative flex items-center rounded-md transition-all">
                  <AtSign className="absolute left-3.5 w-4 h-4 text-[#958ea0]" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@studio.com"
                    className="auth-input-field w-full bg-transparent border-none pl-10 pr-4 text-[#dae2fd] placeholder:text-[#958ea0]/60 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              {!isForgot && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="auth-label text-xs">
                      Mật khẩu
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs text-[#4cd7f6] hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="auth-neon-glow auth-input-surface relative flex items-center rounded-md transition-all">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#958ea0]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="auth-input-field w-full bg-transparent border-none pl-10 pr-10 text-[#dae2fd] placeholder:text-[#958ea0]/60 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-[#958ea0] hover:text-[#dae2fd] transition-colors"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-[#958ea0] auth-body">Tối thiểu 6 ký tự</p>
                  )}
                </div>
              )}

              {isLogin && !isForgot && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberMe(checked);
                      setRememberMePreference(checked);
                    }}
                    className="w-4 h-4 rounded border-white/10 bg-[#171f33] text-[#4cd7f6] focus:ring-[#4cd7f6] focus:ring-offset-[#131b2e]"
                  />
                  <span className="text-xs text-[#cbc3d7]">Ghi nhớ đăng nhập</span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className={`w-full py-3 rounded-md text-white font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
                  success
                    ? "bg-gradient-to-br from-[#4edea3] to-[#00a572] shadow-[0_0_20px_rgba(78,222,163,0.4)]"
                    : "auth-btn-primary"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isForgot ? "Đang gửi..." : "Đang xác thực..."}
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {isForgot ? "Đã gửi email!" : "Thành công!"}
                  </>
                ) : (
                  <>
                    {isForgot ? "Gửi link reset" : isLogin ? "Đăng nhập" : "Đăng ký"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <footer className="mt-6 text-center">
              {isForgot ? (
                <p className="text-sm text-[#cbc3d7]">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="text-[#d0bcff] font-bold hover:underline"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </p>
              ) : (
                <p className="text-sm text-[#cbc3d7]">
                  {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#d0bcff] font-bold hover:underline ml-1"
                  >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                  </button>
                </p>
              )}
              <Link
                to="/"
                className="inline-block mt-3 text-xs text-[#958ea0] hover:text-[#4cd7f6] transition-colors"
              >
                ← Quay lại trang chủ
              </Link>
            </footer>
          </div>

          <div className="absolute bottom-4 right-4 opacity-20 pointer-events-none hidden md:block">
            <span className="auth-code text-[#4cd7f6] opacity-80">SYSTEM_AUTH_READY: 1.0.4</span>
          </div>
        </section>
      </main>
    </div>
  );
}
