import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, Sparkles, ArrowLeft, LogIn, UserPlus, AlertCircle, Copy, Check } from "lucide-react";
import { getDemoAccounts } from "../../data/seedData";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const demoAccounts = getDemoAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (success) {
          // Check user role and redirect accordingly
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          if (currentUser.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          setError("Email hoặc mật khẩu không đúng");
        }
      } else {
        if (!formData.name.trim()) {
          setError("Vui lòng nhập tên của bạn");
          setLoading(false);
          return;
        }
        const success = await register(formData.email, formData.password, formData.name);
        if (success) {
          navigate("/dashboard");
        } else {
          setError("Email đã được sử dụng");
        }
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại trang chủ
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4 shadow-[0_0_30px_rgba(0,217,255,0.3)]">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Đăng nhập để tiếp tục sử dụng AI Assistant"
              : "Nhận ngay 10 xu miễn phí khi đăng ký"}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 shadow-lg">
          {/* Demo Accounts Panel */}
          {isLogin && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <p className="text-foreground font-bold">🎮 Demo Accounts - Dùng thử nhanh</p>
              </div>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <div
                    key={account.email}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {account.title}
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-xs font-mono text-muted-foreground">
                            {account.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {account.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            email: account.email,
                            password: account.password,
                            name: "",
                          });
                          setCopiedAccount(account.email);
                          setTimeout(() => setCopiedAccount(null), 2000);
                        }}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                        title="Click để điền tự động"
                      >
                        {copiedAccount === account.email ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Click icon <Copy className="w-3 h-3 inline" /> để tự động điền thông tin
                </p>
                <details className="text-xs">
                  <summary className="text-warning cursor-pointer hover:text-warning/80 text-center">
                    ⚠️ Không đăng nhập được? Click để xem cách fix
                  </summary>
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-2">
                    <p className="text-foreground font-bold mb-2">🔧 Quick Fix:</p>
                    <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Press <kbd className="px-1 py-0.5 bg-card border border-border rounded text-xs">F12</kbd> để mở Console</li>
                      <li>Run command: <code className="px-1 py-0.5 bg-card border border-border rounded">window.debugStorage.resetAndSeed()</code></li>
                      <li>Refresh trang và thử lại</li>
                    </ol>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tên của bạn
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">Tối thiểu 6 ký tự</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Đăng ký
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ email: "", password: "", name: "" });
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isLogin ? (
                <>Chưa có tài khoản? <span className="underline">Đăng ký ngay</span></>
              ) : (
                <>Đã có tài khoản? <span className="underline">Đăng nhập</span></>
              )}
            </button>
          </div>
        </div>

        {/* Benefits for new users */}
        {!isLogin && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-center bg-card/30 border border-border rounded-lg p-4">
              <div className="text-3xl font-bold text-primary font-mono">10</div>
              <div className="text-sm text-muted-foreground mt-1">xu miễn phí</div>
            </div>
            <div className="text-center bg-card/30 border border-border rounded-lg p-4">
              <div className="text-3xl font-bold text-primary font-mono">∞</div>
              <div className="text-sm text-muted-foreground mt-1">Assets</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}