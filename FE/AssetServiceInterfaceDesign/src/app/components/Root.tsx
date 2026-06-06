import { Outlet, Link, useLocation } from "react-router";
import { Sparkles, Menu, X, LogOut, User, Coins, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, getUserAvatarSrc } from "../contexts/AuthContext";
import { Toaster } from "./ui/sonner";
import { useTheme } from "../contexts/ThemeContext";

export default function Root() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, refreshUserData } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) return;

    const syncCredits = () => void refreshUserData();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") syncCredits();
    };

    window.addEventListener("focus", syncCredits);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", syncCredits);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user, refreshUserData]);

  const isActive = (path: string) => location.pathname === path;
  const isAuthPage =
    location.pathname === "/auth" || location.pathname.startsWith("/auth/");

  const handleLogout = () => {
    void logout().finally(() => setMobileMenuOpen(false));
  };

  const avatarSrc = getUserAvatarSrc(user);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Navigation */}
      {!isAuthPage && (
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:blur-2xl transition-all" />
              </div>
              <span className="text-xl font-bold text-foreground">GameAssets AI</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-5 flex-nowrap">
              <Link
                to="/"
                className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                  isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trang chủ
                {isActive("/") && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                )}
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                  isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Assistant
                {isActive("/dashboard") && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                )}
              </Link>
              <Link
                to="/marketplace"
                className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                  isActive("/marketplace") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Marketplace
                {isActive("/marketplace") && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                )}
              </Link>
              {user && (
                <>
                  <Link
                    to="/my-assets"
                    className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                      isActive("/my-assets")
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Thư viện
                    {isActive("/my-assets") && (
                      <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                    )}
                  </Link>
                </>
              )}
              <Link
                to="/pricing"
                className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                  isActive("/pricing") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Gói dịch vụ
                {isActive("/pricing") && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                )}
              </Link>
              
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                        isActive("/admin")
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Admin Dashboard
                      {isActive("/admin") && (
                        <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                      )}
                    </Link>
                  )}
                  <div className="flex items-center gap-3 ml-2">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-card/80 hover:border-primary/50 transition-all"
                      title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-warning" />
                      ) : (
                        <Moon className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full font-mono text-sm">
                      <Coins className="w-4 h-4 text-warning" />
                      <span className="text-foreground font-medium">{user.credits || 0}</span>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full hover:border-primary/50 hover:bg-card/80 transition-all whitespace-nowrap"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="text-sm text-foreground">{user.name}</span>
                      {user.role === "admin" && (
                        <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-bold rounded-full">
                          ADMIN
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-all hover:scale-105"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="whitespace-nowrap">Đăng xuất</span>
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-border">
              <Link
                to="/"
                className={`block text-sm font-medium ${
                  isActive("/") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                to="/dashboard"
                className={`block text-sm font-medium ${
                  isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                AI Assistant
              </Link>
              <Link
                to="/marketplace"
                className={`block text-sm font-medium ${
                  isActive("/marketplace") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              {user && (
                <>
                  <Link
                    to="/my-assets"
                    className={`block text-sm font-medium ${
                      isActive("/my-assets") ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Thư viện
                  </Link>
                </>
              )}
              <Link
                to="/pricing"
                className={`block text-sm font-medium ${
                  isActive("/pricing") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Gói dịch vụ
              </Link>
              
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className={`block text-sm font-medium ${
                        isActive("/admin") ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="pt-3 border-t border-border space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-warning" />
                      ) : (
                        <Moon className="w-4 h-4 text-primary" />
                      )}
                      <span>
                        {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="w-4 h-4 text-warning" />
                      <span className="text-foreground font-mono font-medium">{user.credits || 0} xu</span>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="text-foreground">{user.name}</span>
                      {user.role === "admin" && (
                        <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-bold rounded-full ml-1">
                          ADMIN
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="block text-sm font-medium text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className={isAuthPage ? "min-h-screen h-screen overflow-hidden" : undefined}>
        <Outlet />
      </main>

      {/* Footer */}
      {!isAuthPage && (
      <footer className="border-t border-border bg-card/30 backdrop-blur-lg mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-foreground font-bold text-lg">GameAssets AI</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Hỗ trợ làm game cho người mới bắt đầu với AI và kho assets chất lượng cao.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-foreground font-bold mb-3">Liên Kết</h3>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Gói dịch vụ
                </Link>
                <Link to="/marketplace" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Marketplace
                </Link>
                <Link to="/dashboard" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  AI Assistant
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-foreground font-bold mb-3">Pháp Lý</h3>
              <div className="space-y-2">
                <Link to="/terms" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Điều khoản sử dụng
                </Link>
                <Link to="/privacy" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Chính sách bảo mật
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center text-muted-foreground text-sm">
            <p>© 2026 GameAssets AI. Phát triển bởi AI với ❤️ cho game creators Việt Nam.</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}