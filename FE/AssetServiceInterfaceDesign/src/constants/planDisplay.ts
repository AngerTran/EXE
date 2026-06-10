import type { SubscriptionPlan } from "../api/types/billing";
import { calculateDiscount } from "../utils/helpers";

/** Giá niêm yết trước khuyến mãi (chỉ hiển thị FE — giá thu thực tế lấy từ `priceVnd`). */
const PLAN_COMPARE_AT_VND: Record<string, number> = {
  student: 59_000,
};

/** Map feature keys từ DB sang mô tả hiển thị tiếng Việt. */
const FEATURE_LABELS: Record<string, string> = {
  marketplace: "Truy cập marketplace đầy đủ — mua asset bằng xu",
  basic_ai: "AI advisor gợi ý asset phù hợp dự án",
  free_assets: "Toàn quyền tải asset miễn phí trên marketplace",
  priority_support: "Hỗ trợ ưu tiên qua email — phản hồi trong 24h",
  vietnamese_docs: "Tài liệu & hướng dẫn tiếng Việt dành cho sinh viên",
  team: "Quản lý team và chia sẻ thư viện asset nội bộ",
  exclusive_packs: "Gói asset độc quyền chỉ dành cho thành viên Pro",
  project_review: "Tư vấn & review dự án game 1-1 từ chuyên gia",
};

export type PlanDisplayMeta = {
  tagline: string;
  features: string[];
};

export const PLAN_DISPLAY: Record<string, PlanDisplayMeta> = {
  free: {
    tagline: "Bắt đầu miễn phí — trải nghiệm AI & marketplace",
    features: [
      "100 xu tặng ngay khi đăng ký tài khoản",
      "Chat AI gợi ý asset phù hợp dự án của bạn",
      "Duyệt & mua asset trên marketplace bằng xu",
      "Hỗ trợ qua email trong giờ hành chính",
    ],
  },
  student: {
    tagline: "Giá sinh viên — lý tưởng cho CNTT, Game & Multimedia",
    features: [
      "1.000 xu được cấp mỗi tháng — đủ cho ~1.000 lượt chat",
      "Gợi ý asset thông minh theo thể loại & engine game",
      "Truy cập đầy đủ marketplace — asset miễn phí & trả phí",
      "Tài liệu tiếng Việt & hỗ trợ email ưu tiên 24h",
    ],
  },
  pro: {
    tagline: "Dành cho indie dev, studio nhỏ & chuyên gia",
    features: [
      "Xu không giới hạn — chat thoải mái không lo hết xu",
      "AI advisor nâng cao — phân tích dự án chi tiết hơn",
      "Gói asset độc quyền & ưu tiên cập nhật nội dung mới",
      "Hỗ trợ ưu tiên — phản hồi trong vòng 2 giờ làm việc",
    ],
  },
};

function looksLikeFeatureKey(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value.trim());
}

export function formatFeatureLabel(raw: string): string {
  const key = raw.trim();
  return FEATURE_LABELS[key] ?? key.replace(/_/g, " ");
}

export function resolvePlanFeatures(plan: SubscriptionPlan): string[] {
  const fallback = PLAN_DISPLAY[plan.slug]?.features ?? [];
  if (plan.features.length === 0) return fallback;

  const mapped = plan.features.map((f) =>
    looksLikeFeatureKey(f) ? formatFeatureLabel(f) : f.trim()
  );

  const mostlyKeys = plan.features.filter(looksLikeFeatureKey).length >= plan.features.length * 0.5;
  return mostlyKeys && fallback.length > 0 ? fallback : mapped;
}

export function resolvePlanTagline(plan: SubscriptionPlan): string {
  if (plan.description?.trim()) return plan.description.trim();
  return PLAN_DISPLAY[plan.slug]?.tagline ?? "";
}

export type PlanPriceDisplay = {
  primary: string;
  primarySuffix?: string;
  secondary?: string;
  highlight?: string;
  compareAt?: string;
  discountPercent?: number;
};

export function formatPlanPrice(plan: SubscriptionPlan): PlanPriceDisplay {
  if (plan.slug === "free" || plan.priceVnd === 0) {
    return {
      primary: "0đ",
      primarySuffix: "/tháng",
      secondary: plan.creditsMonthly
        ? `${plan.creditsMonthly.toLocaleString("vi-VN")} xu tặng một lần khi đăng ký`
        : "Tự động kích hoạt khi tạo tài khoản",
      highlight: "Đã bao gồm với mọi tài khoản mới",
    };
  }

  if (plan.isUnlimited) {
    return {
      primary: `${plan.priceVnd.toLocaleString("vi-VN")}đ`,
      primarySuffix: "/tháng",
      secondary: "Thanh toán chuyển khoản — kích hoạt sau xác nhận",
      highlight: "Xu không giới hạn",
    };
  }

  const compareAtVnd = PLAN_COMPARE_AT_VND[plan.slug];
  const hasPromo =
    compareAtVnd != null && compareAtVnd > plan.priceVnd;

  return {
    primary: `${plan.priceVnd.toLocaleString("vi-VN")}đ`,
    primarySuffix: "/tháng",
    compareAt: hasPromo
      ? `${compareAtVnd.toLocaleString("vi-VN")}đ`
      : undefined,
    discountPercent: hasPromo
      ? calculateDiscount(compareAtVnd, plan.priceVnd)
      : undefined,
    secondary: plan.creditsMonthly
      ? `Bao gồm ${plan.creditsMonthly.toLocaleString("vi-VN")} xu mỗi tháng`
      : undefined,
    highlight: plan.creditsMonthly
      ? `${plan.creditsMonthly.toLocaleString("vi-VN")} xu/tháng`
      : undefined,
  };
}
