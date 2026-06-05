import { useEffect, useState } from "react";
import { Check, Sparkles, Crown, Zap, GraduationCap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { fetchSubscriptionPlans } from "../../api/subscriptionPlans";
import type { SubscriptionPlan } from "../../api/types/billing";

const SLUG_META: Record<
  string,
  { icon: React.ReactNode; color: string; popular?: boolean; badge?: string }
> = {
  free: { icon: <Sparkles className="w-8 h-8" />, color: "from-gray-600 to-gray-700" },
  student: {
    icon: <GraduationCap className="w-8 h-8" />,
    color: "from-blue-600 to-cyan-600",
    popular: true,
    badge: "SẢN PHẨM CHỦ LỰC",
  },
  indie: { icon: <Zap className="w-8 h-8" />, color: "from-purple-600 to-purple-700" },
  pro: { icon: <Crown className="w-8 h-8" />, color: "from-yellow-600 to-orange-600" },
};

const FREE_FALLBACK = {
  id: "free",
  slug: "free",
  name: "Miễn Phí",
  description: null,
  priceVnd: 0,
  creditsMonthly: 10,
  isUnlimited: false,
  features: [
    "10 xu miễn phí khi đăng ký",
    "Gợi ý assets cơ bản",
    "Truy cập marketplace đầy đủ",
    "Hỗ trợ qua email",
  ],
  sortOrder: 0,
  isActive: true,
} satisfies SubscriptionPlan;

function formatPrice(plan: SubscriptionPlan): string {
  if (plan.slug === "free" || plan.priceVnd === 0) {
    return plan.creditsMonthly ? `${plan.creditsMonthly} xu` : "Miễn phí";
  }
  if (plan.isUnlimited) return "∞ xu";
  return plan.creditsMonthly ? `${plan.creditsMonthly} xu` : `${plan.priceVnd.toLocaleString("vi-VN")}đ`;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSubscriptionPlans(true);
        const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
        const hasFree = sorted.some((p) => p.slug === "free");
        if (!cancelled) {
          setPlans(hasFree ? sorted : [FREE_FALLBACK, ...sorted]);
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
    <div className="min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Chọn Gói Phù Hợp Với Bạn
          </h1>
          <p className="text-xl text-muted-foreground">
            Giá sinh viên - Phù hợp với mọi nhu cầu
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Gói Xu Sử Dụng AI
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Đặc biệt dành cho sinh viên và người mới bắt đầu
          </p>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((pkg) => {
                const meta = SLUG_META[pkg.slug] ?? SLUG_META.free;
                const features =
                  pkg.features.length > 0
                    ? pkg.features
                    : pkg.slug === "free"
                      ? FREE_FALLBACK.features
                      : [];
                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-card/50 backdrop-blur-sm border rounded-xl p-6 transition-all hover:scale-105 ${
                      meta.popular
                        ? "border-primary shadow-xl shadow-primary/20 lg:scale-105"
                        : "border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
                    }`}
                  >
                    {meta.popular && meta.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
                        {meta.badge}
                      </div>
                    )}

                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white mb-4 shadow-lg`}
                    >
                      {meta.icon}
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-foreground font-mono">
                        {formatPrice(pkg)}
                      </span>
                      {pkg.slug !== "free" && pkg.priceVnd > 0 && (
                        <span className="text-sm text-muted-foreground">/tháng</span>
                      )}
                      {pkg.isUnlimited ? (
                        <p className="text-success text-sm mt-1 font-semibold">Không giới hạn ∞</p>
                      ) : pkg.creditsMonthly && pkg.creditsMonthly > 0 ? (
                        <p className="text-muted-foreground text-sm mt-1 font-mono">
                          {pkg.creditsMonthly} xu/tháng
                        </p>
                      ) : pkg.slug === "free" ? (
                        <p className="text-muted-foreground text-sm mt-1">Dùng thử miễn phí</p>
                      ) : null}
                      {pkg.priceVnd > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {pkg.priceVnd.toLocaleString("vi-VN")}đ/tháng
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        if (pkg.slug === "free") {
                          navigate("/auth");
                        } else {
                          navigate(`/checkout?package=${pkg.slug}`);
                        }
                      }}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        meta.popular
                          ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                          : "bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {pkg.slug === "free" ? "Đăng ký ngay" : "Mua Gói"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-20 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 lg:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            💡 Lưu Ý Quan Trọng
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <p className="font-bold text-foreground mb-2">🎓 Giá sinh viên:</p>
              <p>
                Chỉ 29k/tháng cho gói STUDENT - giải quyết nỗi lo tài chính cho sinh viên
                CNTT/Game/Multimedia.
              </p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">💰 Hoàn tiền:</p>
              <p>Hoàn 100% nếu không hài lòng trong vòng 7 ngày đầu tiên.</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">🎯 Hỗ trợ:</p>
              <p>Email support luôn sẵn sàng. INDIE & PRO users được ưu tiên phản hồi trong 2h.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
