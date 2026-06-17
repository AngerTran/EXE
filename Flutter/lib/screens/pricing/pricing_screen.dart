import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/plan_display.dart';
import '../../models/billing_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class PricingScreen extends ConsumerWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(_plansProvider);
    final packs = ref.watch(_creditPacksProvider);
    final auth = ref.watch(authProvider);
    final fmt = NumberFormat.decimalPattern('vi');

    return SafeArea(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(_plansProvider);
          ref.invalidate(_creditPacksProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.sm,
            AppSpacing.page,
            AppSpacing.pageBottom,
          ),
          children: [
            const PageHeading(
              title: 'Chọn gói phù hợp với bạn',
              subtitle:
                  'Mọi tài khoản mới đều có sẵn gói Miễn phí — nâng cấp khi cần thêm xu',
            ),
            const SizedBox(height: AppSpacing.lg),
            if (auth.isLoggedIn && auth.user != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                child: AppCard(
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.secondary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: const Icon(
                          Icons.workspace_premium_rounded,
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Gói hiện tại',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(color: AppColors.mutedForeground),
                            ),
                            Text(
                              auth.user!.subscription.toUpperCase(),
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.foreground,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      XuBadge(
                        balance: auth.user!.credits,
                        isUnlimited: auth.user!.isUnlimited,
                        compact: true,
                      ),
                    ],
                  ),
                ),
              ),
            plans.when(
              data: (items) => Column(
                children: items.map((plan) {
                  final isCurrent = auth.user?.subscription == plan.slug;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _PlanCard(
                      plan: plan,
                      isCurrent: isCurrent,
                      isLoggedIn: auth.isLoggedIn,
                      onSelect: isCurrent
                          ? null
                          : auth.isLoggedIn
                              ? () => context.push(
                                    '/checkout/subscription/${plan.slug}',
                                  )
                              : () => context.push('/auth'),
                    ),
                  );
                }).toList(),
              ),
              loading: () => const Padding(
                padding: EdgeInsets.all(AppSpacing.xxl),
                child: LoadingView(message: 'Đang tải gói dịch vụ...'),
              ),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được gói dịch vụ',
                onRetry: () => ref.invalidate(_plansProvider),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            SectionHeader(
              title: 'Hoặc mua thêm xu',
              subtitle: hasPaidSubscription(auth.user?.subscription)
                  ? 'Mua thêm xu một lần khi hết lượt chat AI'
                  : 'Chỉ dành cho người đăng ký gói STUDENT hoặc PRO',
            ),
            packs.when(
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyState(
                    icon: Icons.monetization_on_outlined,
                    title: 'Chưa có gói xu',
                    subtitle: 'Quay lại sau hoặc liên hệ hỗ trợ.',
                  );
                }
                return Column(
                  children: items.map((pack) {
                    final canBuy =
                        auth.isLoggedIn && hasPaidSubscription(auth.user?.subscription);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: _CreditPackCard(
                        pack: pack,
                        fmt: fmt,
                        onTap: canBuy
                            ? () => context.push('/checkout/credits/${pack.id}')
                            : auth.isLoggedIn
                                ? () => context.push('/checkout/subscription/student')
                                : () => context.push('/auth'),
                        subtitle: canBuy
                            ? 'Bấm để mua gói xu'
                            : auth.isLoggedIn
                                ? 'Nâng cấp STUDENT/PRO để mua thêm xu'
                                : 'Đăng nhập để mua xu',
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
                child: LinearProgressIndicator(color: AppColors.primary),
              ),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được gói xu',
                onRetry: () => ref.invalidate(_creditPacksProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final _plansProvider = FutureProvider<List<SubscriptionPlan>>((ref) async {
  final service = await ref.watch(subscriptionServiceProvider.future);
  return service.fetchPlans();
});

final _creditPacksProvider = FutureProvider<List<CreditPack>>((ref) async {
  final service = await ref.watch(creditPackServiceProvider.future);
  return service.fetchPacks();
});

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.isCurrent,
    required this.isLoggedIn,
    required this.onSelect,
  });

  final SubscriptionPlan plan;
  final bool isCurrent;
  final bool isLoggedIn;
  final VoidCallback? onSelect;

  Color _titleColor() {
    switch (plan.slug) {
      case 'student':
        return AppColors.primary;
      case 'pro':
        return AppColors.warning;
      default:
        return AppColors.foreground;
    }
  }

  String? _badgeLabel() {
    switch (plan.slug) {
      case 'student':
        return 'PHỔ BIẾN NHẤT';
      case 'pro':
        return 'GIÁ TRỊ TỐT NHẤT';
      default:
        return null;
    }
  }

  String _ctaLabel() {
    if (isCurrent) return 'Gói hiện tại';
    if (plan.slug == 'free') {
      return isLoggedIn ? 'Đã bao gồm khi đăng ký' : 'Bắt đầu miễn phí';
    }
    return isLoggedIn ? 'Nâng cấp ngay' : 'Đăng ký ngay';
  }

  @override
  Widget build(BuildContext context) {
    final price = formatPlanPrice(plan);
    final features = resolvePlanFeatures(plan);
    final tagline = resolvePlanTagline(plan);
    final highlight = plan.slug == 'student' || plan.slug == 'pro';
    final badge = _badgeLabel();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: highlight
            ? LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.14),
                  AppColors.secondary.withValues(alpha: 0.08),
                ],
              )
            : null,
        color: highlight ? null : AppColors.card.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: isCurrent
              ? AppColors.primary
              : highlight
                  ? AppColors.primary.withValues(alpha: 0.35)
                  : AppColors.border,
          width: isCurrent ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (plan.slug == 'student')
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Text(
                'SẢN PHẨM CHỦ LỰC',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Text(
                  plan.name.toUpperCase(),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: _titleColor(),
                        letterSpacing: 0.4,
                      ),
                ),
              ),
              if (badge != null && !isCurrent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badge,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                        ),
                  ),
                ),
              if (isCurrent) ...[
                const SizedBox(width: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Đang dùng',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
            ],
          ),
          if (tagline.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              tagline,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                    height: 1.4,
                  ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                price.primary,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              if (price.primarySuffix != null)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 4),
                  child: Text(
                    price.primarySuffix!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
                ),
              if (price.compareAt != null) ...[
                const SizedBox(width: AppSpacing.sm),
                Text(
                  price.compareAt!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.mutedForeground,
                        decoration: TextDecoration.lineThrough,
                      ),
                ),
              ],
              if (price.discountPercent != null) ...[
                const SizedBox(width: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    '-${price.discountPercent}%',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.warning,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
            ],
          ),
          if (price.highlight != null) ...[
            const SizedBox(height: 4),
            Text(
              'Xu AI: ${price.highlight}',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppColors.foreground,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
          if (price.secondary != null) ...[
            const SizedBox(height: 2),
            Text(
              price.secondary!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 16,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      f,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.foreground,
                            height: 1.4,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          GradientCtaButton(
            label: _ctaLabel(),
            icon: isCurrent ? Icons.check_rounded : Icons.arrow_forward_rounded,
            expand: true,
            onPressed: onSelect,
          ),
        ],
      ),
    );
  }
}

class _CreditPackCard extends StatelessWidget {
  const _CreditPackCard({
    required this.pack,
    required this.fmt,
    required this.onTap,
    required this.subtitle,
  });

  final CreditPack pack;
  final NumberFormat fmt;
  final VoidCallback onTap;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: const Icon(
                  Icons.monetization_on_outlined,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '${fmt.format(pack.priceVnd)}đ',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.foreground,
                              ),
                        ),
                        if (pack.discountPercent != null &&
                            pack.discountPercent! > 0) ...[
                          const SizedBox(width: AppSpacing.sm),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.warning.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '-${pack.discountPercent}%',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppColors.warning,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      '${fmt.format(pack.credits)} xu · ${formatUnitPricePer100(pack)} / 100 xu',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColors.primary,
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.mutedForeground,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
