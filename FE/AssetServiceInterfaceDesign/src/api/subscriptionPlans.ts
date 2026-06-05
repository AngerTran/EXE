import { apiRequest } from "./client";
import type { SubscriptionPlan } from "./types/billing";

interface PlanListResponse {
  data: SubscriptionPlan[];
}

export async function fetchSubscriptionPlans(activeOnly = true): Promise<SubscriptionPlan[]> {
  const res = await apiRequest<PlanListResponse>(
    `/subscription-plans?activeOnly=${activeOnly}`,
    { auth: false }
  );
  return res.data ?? [];
}

export async function fetchSubscriptionPlanBySlug(
  slug: string,
  activeOnly = true
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(
    `/subscription-plans/slug/${slug}?activeOnly=${activeOnly}`,
    { auth: false }
  );
}
