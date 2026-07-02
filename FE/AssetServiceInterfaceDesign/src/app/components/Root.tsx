import { Outlet, Link, useLocation } from "react-router";
import { Menu, LogOut, User, Coins, Moon, Sun, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, getUserAvatarSrc } from "../contexts/AuthContext";
import { formatWalletBalance } from "../../utils/helpers";
import { UnlimitedXuIcon } from "./UnlimitedXuIcon";
import { SubscriptionPlanBadge } from "./SubscriptionPlanBadge";
import { AppLogo, APP_NAME } from "./AppLogo";
import { Toaster } from "./ui/sonner";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "../contexts/ThemeContext";
import { useSubscriptionAlerts } from "../../hooks/useSubscriptionAlerts";
import { useAdminPendingOrderAlerts } from "../../hooks/useAdminPendingOrderAlerts";
import {
  MobileBottomNav,
  shouldShowMobileBottomNav,
} from "./layout/MobileBottomNav";
import { FooterSocialLinks } from "./layout/FooterSocialLinks";
import { MobileAppDownload } from "./layout/MobileAppDownload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { componentClasses } from "../../constants/theme";

export default function Root() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, refreshUserData, isSeller } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isAuthPage =
    location.pathname === "/auth" || location.pathname.startsWith("/auth/");

  useEffect(() => {
    document.documentElement.classList.toggle("no-site-bg", isAuthPage);
    return () => document.documentElement.classList.remove("no-site-bg");
  }, [isAuthPage]);

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

  const handleLogout = () => {
    void logout().finally(() => setMobileMenuOpen(false));
  };

  const avatarSrc = getUserAvatarSrc(user);
  useSubscriptionAlerts(user);
  const { pendingCount: adminPendingOrders } = useAdminPendingOrderAlerts(user);
  const showMobileTabBar = shouldShowMobileBottomNav(location.pathname);
  const isDashboardPage = location.pathname === "/dashboard";

  const rootClassName = isDashboardPage
    ? "relative flex flex-col h-dvh max-h-dvh overflow-hidden"
    : `min-h-screen relative ${showMobileTabBar ? "has-mobile-tab-bar" : ""}`;

  return (
    <div className={rootClassName}>
      <Toaster />
      {/* Navigation */}
      {!isAuthPage && (
      <nav
        className={
          isDashboardPage
            ? "border-b border-border/30 bg-[#dce3ed]/95 dark:bg-background/35 backdrop-blur-md z-50 shrink-0 shadow-sm"
            : "border-b border-border bg-white/95 dark:bg-card/70 backdrop-blur-lg sticky top-0 z-50 shadow-sm shrink-0"
        }
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center group">
              <AppLogo size="md" />
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
                AssetBox AI
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
                Chợ Assets
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
                  {(user.role === "seller" || user.role === "admin") && (
                    <Link
                      to="/seller"
                      className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                        location.pathname.startsWith("/seller")
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Seller Hub
                      {location.pathname.startsWith("/seller") && (
                        <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                      )}
                    </Link>
                  )}
                  {user.role === "customer" && (
                    <Link
                      to="/seller/apply"
                      className={`text-sm font-medium transition-all relative group whitespace-nowrap ${
                        isActive("/seller/apply")
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Trở thành người bán
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className={`text-sm font-medium transition-all relative group whitespace-nowrap flex items-center gap-1.5 ${
                        isActive("/admin")
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Admin Dashboard
                      {adminPendingOrders > 0 && (
                        <span
                          className="min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center"
                          title={`${adminPendingOrders} đơn chờ xác nhận`}
                        >
                          {adminPendingOrders > 9 ? "9+" : adminPendingOrders}
                        </span>
                      )}
                      {isActive("/admin") && (
                        <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                      )}
                    </Link>
                  )}
                  <div className="flex items-center gap-3 ml-2">
                    <NotificationBell adminPendingOrders={adminPendingOrders} />
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card border border-border rounded-lg hover:bg-white dark:hover:bg-card/80 hover:border-primary/50 transition-all"
                      title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-warning" />
                      ) : (
                        <Moon className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/40 rounded-full font-mono text-sm text-warning"
                      title={user.isUnlimited ? "Xu không giới hạn (gói Pro)" : undefined}
                    >
                      <Coins className="w-4 h-4 text-warning shrink-0" />
                      {user.isUnlimited ? (
                        <UnlimitedXuIcon size="sm" />
                      ) : (
                        <span className="font-medium tabular-nums text-warning">
                          {formatWalletBalance(user.credits, false)}
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-border rounded-full hover:border-primary/50 hover:bg-white dark:hover:bg-card/80 transition-all whitespace-nowrap"
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
                      <SubscriptionPlanBadge plan={user.subscription} />
                      {user.role === "admin" && (
                        <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-bold rounded-full">
                          ADMIN
                        </span>
                      )}
                      {user.role === "seller" && (
                        <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-bold rounded-full">
                          SELLER
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

            {/* Mobile quick actions + menu */}
            <div className="md:hidden flex items-center gap-1">
              {user ? (
                <>
                  <NotificationBell adminPendingOrders={adminPendingOrders} />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={componentClasses.iconButton}
                    title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5 text-warning" />
                    ) : (
                      <Moon className="w-5 h-5 text-primary" />
                    )}
                  </button>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-warning/40 bg-warning/10 font-mono text-xs text-warning shrink-0"
                    title={user.isUnlimited ? "Xu không giới hạn" : undefined}
                  >
                    <Coins className="w-3.5 h-3.5 text-warning" />
                    {user.isUnlimited ? (
                      <UnlimitedXuIcon size="sm" />
                    ) : (
                      <span className="tabular-nums text-warning">
                        {formatWalletBalance(user.credits, false)}
                      </span>
                    )}
                  </Link>
                </>
              ) : null}
              <button
                type="button"
                className={`${componentClasses.iconButton} ml-0.5`}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      )}

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] p-0">
          <SheetHeader className="border-b border-border p-4 text-left">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Điều hướng chính AssetBox</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
            {[
              { to: "/", label: "Trang chủ" },
              { to: "/dashboard", label: "AssetBox AI" },
              { to: "/marketplace", label: "Chợ Assets" },
              ...(user ? [{ to: "/my-assets", label: "Thư viện" }] : []),
              { to: "/pricing", label: "Gói dịch vụ" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`touch-target justify-start px-3 rounded-lg text-sm font-medium ${
                  isActive(link.to) ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isSeller() && (
              <Link
                to="/seller"
                onClick={() => setMobileMenuOpen(false)}
                className={`touch-target justify-start px-3 rounded-lg text-sm font-medium ${
                  location.pathname.startsWith("/seller") ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                Seller Hub
              </Link>
            )}
            {user?.role === "customer" && (
              <Link
                to="/seller/apply"
                onClick={() => setMobileMenuOpen(false)}
                className={`touch-target justify-start px-3 rounded-lg text-sm font-medium ${
                  isActive("/seller/apply") ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                Trở thành người bán
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`touch-target justify-start px-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  isActive("/admin") ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                Admin Dashboard
                {adminPendingOrders > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
                    {adminPendingOrders > 9 ? "9+" : adminPendingOrders}
                  </span>
                )}
              </Link>
            )}
            <div className="border-t border-border my-3 pt-3 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="touch-target justify-start px-3 gap-2 rounded-lg text-sm text-foreground"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="truncate">{user.name}</span>
                    <SubscriptionPlanBadge plan={user.subscription} />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="touch-target justify-start px-3 gap-2 w-full rounded-lg text-sm text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="touch-target justify-start px-3 rounded-lg text-sm font-medium text-primary"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main
        className={
          isAuthPage
            ? "min-h-screen h-screen overflow-hidden"
            : isDashboardPage
              ? "flex-1 min-h-0 overflow-hidden"
              : undefined
        }
      >
        <Outlet />
      </main>

      {showMobileTabBar && <MobileBottomNav isLoggedIn={!!user} />}

      {/* Footer */}
      {!isAuthPage && !isDashboardPage && (
      <footer className={`site-footer border-t border-border bg-white/95 dark:bg-card/60 backdrop-blur-lg mt-20 shadow-sm ${showMobileTabBar ? "mb-16 md:mb-0" : ""}`}>
        <div className={`${componentClasses.container} py-12`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AppLogo size="sm" />
              </div>
              <p className="text-muted-foreground text-sm">
                Hỗ trợ làm game cho người mới bắt đầu với AI và kho assets chất lượng cao.
              </p>
              <a
                href="tel:0972362174"
                className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Phone className="w-4 h-4" />
                Hotline: 0972362174
              </a>
            </div>

            {/* Quick Links + Tải app */}
            <div>
              <h3 className="text-foreground font-bold mb-3">Liên Kết</h3>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Gói dịch vụ
                </Link>
                <Link to="/marketplace" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  Chợ Assets
                </Link>
                <Link to="/dashboard" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                  AssetBox AI
                </Link>
              </div>
              <MobileAppDownload variant="footer" />
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

            {/* Social */}
            <FooterSocialLinks />
          </div>

          <div className="border-t border-border pt-6 text-center text-foreground/80 text-sm">
            <p className="drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]">
              © 2026 {APP_NAME}. Xây dựng cùng AI, dành cho game creators Việt Nam.
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}