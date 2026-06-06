import type { SubscriptionPlan } from "../api/types/billing";

export type PlanSlug = "free" | "student" | "pro";

export const PLAN_SLUG_OPTIONS: { value: PlanSlug; label: string }[] = [
  { value: "free", label: "free — Miễn phí" },
  { value: "student", label: "student — Sinh viên (29k)" },
  { value: "pro", label: "pro — Pro (99k)" },
];

export type SubscriptionPlanDraft = Omit<SubscriptionPlan, "id">;

export const SUBSCRIPTION_PLAN_TEMPLATES: Record<PlanSlug, SubscriptionPlanDraft> = {
  free: {
    slug: "free",
    name: "Miễn Phí",
    description: "Bắt đầu miễn phí — trải nghiệm AI & marketplace",
    priceVnd: 0,
    creditsMonthly: 100,
    isUnlimited: false,
    features: [
      "100 xu tặng ngay khi đăng ký tài khoản",
      "Chat AI gợi ý asset phù hợp dự án của bạn",
      "Duyệt & mua asset trên marketplace bằng xu",
      "Hỗ trợ qua email trong giờ hành chính",
    ],
    sortOrder: 0,
    isActive: true,
  },
  student: {
    slug: "student",
    name: "Student",
    description: "Giá sinh viên — lý tưởng cho CNTT, Game & Multimedia",
    priceVnd: 29_000,
    creditsMonthly: 1000,
    isUnlimited: false,
    features: [
      "1.000 xu được cấp mỗi tháng — đủ cho ~1.000 lượt chat",
      "Gợi ý asset thông minh theo thể loại & engine game",
      "Truy cập đầy đủ marketplace — asset miễn phí & trả phí",
      "Tài liệu tiếng Việt & hỗ trợ email ưu tiên 24h",
    ],
    sortOrder: 1,
    isActive: true,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    description: "Dành cho indie dev, studio nhỏ & chuyên gia",
    priceVnd: 99_000,
    creditsMonthly: null,
    isUnlimited: true,
    features: [
      "Xu không giới hạn — chat thoải mái không lo hết xu",
      "AI advisor nâng cao — phân tích dự án chi tiết hơn",
      "Gói asset độc quyền & ưu tiên cập nhật nội dung mới",
      "Hỗ trợ ưu tiên — phản hồi trong vòng 2 giờ làm việc",
    ],
    sortOrder: 2,
    isActive: true,
  },
};

export function emptyPlanDraft(): SubscriptionPlanDraft {
  return {
    slug: "student",
    name: "",
    description: "",
    priceVnd: 0,
    creditsMonthly: 0,
    isUnlimited: false,
    features: [],
    sortOrder: 0,
    isActive: true,
  };
}

export function hasPaidSubscription(plan: string | null | undefined): boolean {
  return plan === "student" || plan === "indie" || plan === "pro";
}
