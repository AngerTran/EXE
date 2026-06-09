import { Link, useLocation } from "react-router";
import {
  Home,
  Sparkles,
  ShoppingBag,
  Library,
  User,
  CreditCard,
  LogIn,
} from "lucide-react";
import { cn } from "../ui/utils";
import { mobileNav } from "../../../design-system";

const ICONS = {
  home: Home,
  ai: Sparkles,
  marketplace: ShoppingBag,
  library: Library,
  profile: User,
  pricing: CreditCard,
  auth: LogIn,
} as const;

export function shouldShowMobileBottomNav(pathname: string): boolean {
  return !mobileNav.hiddenRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

interface MobileBottomNavProps {
  isLoggedIn: boolean;
}

export function MobileBottomNav({ isLoggedIn }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const items = isLoggedIn ? mobileNav.authenticated : mobileNav.guest;

  const isActive = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/95 dark:bg-card/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Điều hướng chính"
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {items.map(({ route, label, key }) => {
          const Icon = ICONS[key as keyof typeof ICONS];
          const active = isActive(route);
          return (
            <Link
              key={key}
              to={route}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 touch-target text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  active && "drop-shadow-[0_0_6px_rgba(0,217,255,0.5)]"
                )}
              />
              <span className="truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
