import { useEffect, useState } from "react";
import {
  Check,
  Sparkles,
  Crown,
  GraduationCap,
  Loader2,
  ChevronRight,
  Coins,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { fetchSubscriptionPlans } from "../../api/subscriptionPlans";
import { fetchCreditPacks } from "../../api/creditPacks";
import type { SubscriptionPlan } from "../../api/types/billing";
import { componentClasses } from "../../constants/theme";
import {
  formatPlanPrice,
  resolvePlanFeatures,
  resolvePlanTagline,
} from "../../constants/planDisplay";
import {
  CREDIT_PACKS_FALLBACK,
  formatPackPrice,
  formatUnitPricePer100,
  mapCreditPackItem,
  sortCreditPacks,
  type CreditPack,
} from "../../constants/creditPacks";
import { hasPaidSubscription } from "../../constants/subscriptionPlanTemplates";
import { cn } from "./ui/utils";
import { toast } from "../../utils/notify";

type SlugMeta = {
  icon: React.ReactNode;
  iconBg: string;
  titleClass: string;
  badge?: string;
  popular?: boolean;
  topBanner?: string;
};

const SLUG_META: Record<string, SlugMeta> = {
  free: {
    icon: <Sparkles className="w-5 h-5" />,
    iconBg: "from-slate-500/80 to-slate-600",
    titleClass: "text-foreground",
  },
  student: {
    icon: <GraduationCap className="w-5 h-5" />,
    iconBg: "from-blue-500 to-cyan-500",
    titleClass: "text-primary",
    popular: true,
    topBanner: "SẢN PHẨM CHỦ LỰC",
    badge: "PHỔ BIẾN NHẤT",
  },
  pro: {
    icon: <Crown className="w-5 h-5" />,
    iconBg: "from-amber-500 to-orange-600",
    titleClass: "text-warning",
    badge: "GIÁ TRỊ TỐT NHẤT",
  },
};

const FREE_FALLBACK: SubscriptionPlan = {
  id: "free",
  slug: "free",
  name: "Miễn Phí",
  description: "Bắt đầu miễn phí — trải nghiệm AI & marketplace",
  priceVnd: 0,
  creditsMonthly: 100,
  isUnlimited: false,
  features: [],
  sortOrder: 0,
  isActive: true,
};

type CtaConfig = {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  style: "current" | "outline" | "primary" | "accent";
};

function resolvePlanCta(
  pkg: SubscriptionPlan,
  isLoggedIn: boolean,
  currentPlan: string | null | undefined,
  navigate: ReturnType<typeof useNavigate>
): CtaConfig {
  const isCurrent = isLoggedIn && currentPlan === pkg.slug;

  if (isCurrent) {
    return { label: "Gói hiện tại", disabled: true, style: "current" };
  }

  if (pkg.slug === "free") {
    if (!isLoggedIn) {
      return {
        label: "Bắt đầu miễn phí",
        style: "outline",
        onClick: () => navigate("/auth"),
      };
    }
    return { label: "Đã bao gồm khi đăng ký", disabled: true, style: "current" };
  }

  if (!isLoggedIn) {
    return {
      label: "Đăng ký ngay",
      style: pkg.slug === "student" ? "primary" : "accent",
      onClick: () => navigate("/auth"),
    };
  }

  return {
    label: "Nâng cấp ngay",
    style: pkg.slug === "student" ? "primary" : "accent",
    onClick: () => navigate(`/checkout?package=${pkg.slug}`),
  };
}

function PlanCtaButton({ cta }: { cta: CtaConfig }) {
  const base =
    "w-full rounded-full py-3.5 px-6 text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5";

  const styles: Record<CtaConfig["style"], string> = {
    current: "bg-muted/60 text-muted-foreground border border-border cursor-default",
    outline:
      "bg-transparent text-foreground border-2 border-border hover:border-primary/50 hover:bg-muted/30",
    primary:
      "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(0,217,255,0.35)] shadow-md",
    accent:
      "bg-foreground text-background hover:opacity-90 shadow-md hover:scale-[1.02]",
  };

  return (
    <button
      type="button"
      disabled={cta.disabled}
      onClick={cta.onClick}
      className={cn(base, styles[cta.style], cta.disabled && "opacity-80")}
    >
      {cta.label}
      {!cta.disabled && cta.style !== "current" && cta.style !== "outline" && (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  );
}

function CreditPackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: CreditPack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex-1 min-w-0 text-left rounded-xl border-2 p-4 sm:p-5 transition-all",
        "bg-card/60 hover:bg-card/80",
        selected
          ? "border-success shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-success/30"
          : "border-border hover:border-border/80"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-1 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
            selected ? "border-success" : "border-muted-foreground/50"
          )}
        >
          {selected && <span className="w-2.5 h-2.5 rounded-full bg-success" />}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
              {formatPackPrice(pack)}
            </span>
            {pack.discountPercent != null && pack.discountPercent > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-warning/50 text-warning bg-warning/10">
                -{pack.discountPercent}%
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-snug">
            <span className="text-foreground font-medium">
              {pack.credits.toLocaleString("vi-VN")} xu
            </span>
            <span className="mx-1">·</span>
            <span className="font-mono text-xs">
              ({formatUnitPricePer100(pack)} / 100 xu)
            </span>
          </p>
        </div>
      </div>
    </button>
  );
}

function CreditPackSection({ packs }: { packs: CreditPack[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activePacks = packs.filter((p) => p.isActive !== false);
  const [selectedPackId, setSelectedPackId] = useState(activePacks[1]?.id ?? activePacks[0]?.id ?? "");

  const isSubscriber = hasPaidSubscription(user?.subscription);
  const selectedPack = activePacks.find((p) => p.id === selectedPackId) ?? activePacks[0];

  const handleBuy = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isSubscriber) {
      toast.message("Nâng cấp gói STUDENT hoặc PRO trước khi mua thêm xu.");
      navigate("/checkout?package=student");
      return;
    }
    if (!selectedPack) return;
    navigate(`/checkout-credits?pack=${selectedPack.id}`);
  };

  if (activePacks.length === 0) return null;

  return (
    <section className="mt-16 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
          <Coins className="w-6 h-6 text-success" />
          Hoặc mua thêm xu
          <span className="text-sm font-normal text-muted-foreground">
            (Chỉ dành cho người đăng ký gói trả phí)
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Mua thêm xu một lần khi hết lượt chat AI — không thay thế gói tháng, cộng trực tiếp vào
          ví sau khi chuyển khoản được xác nhận.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {activePacks.map((pack) => (
          <CreditPackCard
            key={pack.id}
            pack={pack}
            selected={selectedPackId === pack.id}
            onSelect={() => setSelectedPackId(pack.id)}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <button
          type="button"
          onClick={handleBuy}
          className="bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white font-bold py-3.5 px-8 rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-success/20"
        >
          {user
            ? isSubscriber
              ? `Mua ${selectedPack!.credits.toLocaleString("vi-VN")} xu — ${formatPackPrice(selectedPack!)}`
              : "Nâng cấp gói để mua thêm xu"
            : "Đăng nhập để mua xu"}
        </button>
        {!user && (
          <p className="text-sm text-muted-foreground">Đăng nhập và có gói STUDENT/PRO để sử dụng.</p>
        )}
        {user && !isSubscriber && (
          <p className="text-sm text-muted-foreground">
            Bạn đang dùng gói Miễn phí —{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => navigate("/checkout?package=student")}
            >
              nâng cấp STUDENT
            </button>{" "}
            để mở khóa mua thêm xu.
          </p>
        )}
      </div>
    </section>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>(CREDIT_PACKS_FALLBACK);
  const [loading, setLoading] = useState(true);

  const currentPlan = user?.subscription ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, packsRes] = await Promise.all([
          fetchSubscriptionPlans(true),
          fetchCreditPacks().catch(() => []),
        ]);
        const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
        const hasFree = sorted.some((p) => p.slug === "free");
        if (!cancelled) {
          setPlans(hasFree ? sorted : [FREE_FALLBACK, ...sorted]);
          if (packsRes.length > 0) {
            setCreditPacks(sortCreditPacks(packsRes.map(mapCreditPackItem)));
          }
        }
      } catch {
        if (!cancelled) setPlans([FREE_FALLBACK]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cn(componentClasses.page)}>
      <div className={componentClasses.container}>
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Chọn Gói Phù Hợp Với Bạn
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mọi tài khoản mới đều có sẵn gói Miễn phí — nâng cấp khi cần thêm xu
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch max-w-6xl mx-auto">
            {plans.map((pkg) => {
              const meta = SLUG_META[pkg.slug] ?? SLUG_META.free;
              const price = formatPlanPrice(pkg);
              const features = resolvePlanFeatures(pkg);
              const tagline = resolvePlanTagline(pkg);
              const cta = resolvePlanCta(pkg, !!user, currentPlan, navigate);
              const isCurrent = !!user && currentPlan === pkg.slug;

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card/40 overflow-hidden transition-all",
                    meta.popular
                      ? "border-primary/60 shadow-xl shadow-primary/10 ring-1 ring-primary/25 lg:scale-[1.02]"
                      : "border-border hover:border-border/80",
                    isCurrent && "ring-2 ring-success/40 border-success/30"
                  )}
                >
                  {meta.topBanner && (
                    <div className="bg-gradient-to-r from-primary/90 to-secondary/90 text-primary-foreground text-center text-[11px] font-bold py-2 tracking-wider uppercase">
                      {meta.topBanner}
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-6">
                    {/* Tên gói — trên cùng */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                              meta.iconBg
                            )}
                          >
                            {meta.icon}
                          </div>
                          <h3
                            className={cn(
                              "text-2xl font-bold tracking-tight uppercase",
                              meta.titleClass
                            )}
                          >
                            {pkg.slug === "free" ? "Free" : pkg.name}
                          </h3>
                        </div>
                        {meta.badge && (
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wide",
                              meta.popular
                                ? "border-primary/50 text-primary bg-primary/10"
                                : "border-warning/40 text-warning bg-warning/10"
                            )}
                          >
                            {meta.badge}
                          </span>
                        )}
                      </div>

                      {tagline && (
                        <p className="text-sm text-muted-foreground leading-snug pl-[2.875rem]">
                          {tagline}
                        </p>
                      )}
                    </div>

                    {/* Giá — ngay dưới tên gói */}
                    <div className="mb-5 pb-5 border-b border-border/50">
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-4xl font-bold text-foreground font-mono tracking-tight">
                          {price.primary}
                        </span>
                        {price.primarySuffix && (
                          <span className="text-base text-muted-foreground font-medium">
                            {price.primarySuffix}
                          </span>
                        )}
                      </div>

                      {price.highlight && (
                        <p
                          className={cn(
                            "mt-1.5 text-sm font-semibold",
                            pkg.isUnlimited ? "text-success" : "text-primary"
                          )}
                        >
                          {price.highlight}
                        </p>
                      )}

                      {price.secondary && (
                        <p className="mt-1 text-xs text-muted-foreground">{price.secondary}</p>
                      )}
                    </div>

                    {/* Nút CTA */}
                    <div className="mb-6">
                      <PlanCtaButton cta={cta} />
                    </div>

                    {/* Quyền lợi */}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Quyền lợi
                      </p>
                      <ul className="space-y-2.5">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground/85 leading-snug">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && <CreditPackSection packs={creditPacks} />}

        <div className={cn(componentClasses.card, "hover:scale-100 p-8 lg:p-10 mt-16 max-w-6xl mx-auto")}>
          <h3 className="text-xl font-bold text-foreground mb-5 text-center">Lưu ý quan trọng</h3>
          <div className="grid sm:grid-cols-2 gap-5 text-muted-foreground text-sm leading-relaxed">
            <div>
              <p className="font-semibold text-foreground mb-1">Gói Miễn phí</p>
              <p>
                Tự động kích hoạt khi tạo tài khoản — nhận 100 xu tặng, không cần thanh toán.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Gói STUDENT</p>
              <p>
                29.000đ/tháng, nhận 1.000 xu mỗi tháng. Thanh toán chuyển khoản VietQR.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Gói PRO</p>
              <p>99.000đ/tháng — xu không giới hạn, hỗ trợ ưu tiên trong 2 giờ.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Xu dùng để làm gì?</p>
              <p>1 xu / lượt chat AI. Xu cũng dùng mua asset trả phí trên marketplace.</p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-semibold text-foreground mb-1">Gói mua thêm xu</p>
              <p>
                Dành cho thành viên STUDENT/PRO: 29.000đ (200 xu), 79.000đ (800 xu, tiết kiệm 32%),
                150.000đ (1.900 xu, tiết kiệm 45%). Thanh toán VietQR, xu cộng vào ví sau xác nhận.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
