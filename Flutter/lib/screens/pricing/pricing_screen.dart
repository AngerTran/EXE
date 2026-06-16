import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:intl/intl.dart';



import '../../core/theme/app_colors.dart';

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

          padding: const EdgeInsets.all(16),

          children: [

            const SectionHeader(

              title: 'Gói dịch vụ',

              subtitle: 'Nâng cấp xu AI và mở khóa tính năng nâng cao.',

            ),

            plans.when(

              data: (items) => Column(

                children: items

                    .map((plan) {

                      final isCurrent = auth.user?.subscription == plan.slug;

                      return Padding(

                        padding: const EdgeInsets.only(bottom: 12),

                        child: _PlanCard(

                          plan: plan,

                          priceLabel: plan.priceVnd == 0

                              ? 'Miễn phí'

                              : '${fmt.format(plan.priceVnd)}đ/tháng',

                          creditsLabel: plan.isUnlimited

                              ? 'Xu AI: Không giới hạn'

                              : 'Xu AI: ${fmt.format(plan.creditsMonthly ?? 0)}/tháng',

                          isCurrent: isCurrent,

                          onSelect: isCurrent

                              ? null

                              : auth.isLoggedIn

                                  ? () => context.push(

                                        '/checkout/subscription/${plan.slug}',

                                      )

                                  : () => context.push('/auth'),

                        ),

                      );

                    })

                    .toList(),

              ),

              loading: () => const Padding(

                padding: EdgeInsets.all(24),

                child: Center(

                  child: CircularProgressIndicator(color: AppColors.primary),

                ),

              ),

              error: (e, _) => EmptyState(

                icon: Icons.cloud_off_outlined,

                title: 'Không tải được gói dịch vụ',

                subtitle: e.toString(),

              ),

            ),

            const SizedBox(height: 24),

            const SectionHeader(

              title: 'Gói nạp xu',

              subtitle: 'Mua thêm xu AI một lần.',

            ),

            packs.when(

              data: (items) {

                if (items.isEmpty) {

                  return Text(

                    'Chưa có gói xu.',

                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(

                          color: AppColors.mutedForeground,

                        ),

                  );

                }

                return Column(

                  children: items

                      .map(

                        (pack) => Card(

                          margin: const EdgeInsets.only(bottom: 10),

                          color: AppColors.card.withValues(alpha: 0.55),

                          child: ListTile(

                            title: Text(pack.name),

                            subtitle: Text('${fmt.format(pack.credits)} xu'),

                            trailing: Text(

                              '${fmt.format(pack.priceVnd)}đ',

                              style: const TextStyle(

                                fontWeight: FontWeight.w700,

                                color: AppColors.primary,

                              ),

                            ),

                            onTap: auth.isLoggedIn

                                ? () => context.push(

                                      '/checkout/credits/${pack.id}',

                                    )

                                : () => context.push('/auth'),

                          ),

                        ),

                      )

                      .toList(),

                );

              },

              loading: () => const LinearProgressIndicator(

                color: AppColors.primary,

              ),

              error: (_, __) => const SizedBox.shrink(),

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

    required this.priceLabel,

    required this.creditsLabel,

    required this.isCurrent,

    required this.onSelect,

  });



  final SubscriptionPlan plan;

  final String priceLabel;

  final String creditsLabel;

  final bool isCurrent;

  final VoidCallback? onSelect;



  @override

  Widget build(BuildContext context) {

    final highlight = plan.slug == 'pro' || plan.slug == 'indie';



    return Container(

      padding: const EdgeInsets.all(18),

      decoration: BoxDecoration(

        gradient: highlight

            ? LinearGradient(

                colors: [

                  AppColors.primary.withValues(alpha: 0.12),

                  AppColors.secondary.withValues(alpha: 0.08),

                ],

              )

            : null,

        color: highlight ? null : AppColors.card.withValues(alpha: 0.55),

        borderRadius: BorderRadius.circular(16),

        border: Border.all(

          color: isCurrent

              ? AppColors.primary

              : highlight

                  ? AppColors.primary.withValues(alpha: 0.4)

                  : AppColors.border,

          width: isCurrent ? 2 : 1,

        ),

      ),

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Expanded(

                child: Text(

                  plan.name,

                  style: Theme.of(context).textTheme.titleLarge?.copyWith(

                        fontWeight: FontWeight.w700,

                      ),

                ),

              ),

              if (isCurrent)

                Container(

                  padding:

                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),

                  decoration: BoxDecoration(

                    color: AppColors.primary.withValues(alpha: 0.15),

                    borderRadius: BorderRadius.circular(8),

                  ),

                  child: const Text(

                    'Đang dùng',

                    style: TextStyle(

                      color: AppColors.primary,

                      fontSize: 11,

                      fontWeight: FontWeight.w700,

                    ),

                  ),

                ),

            ],

          ),

          if (plan.description != null) ...[

            const SizedBox(height: 6),

            Text(

              plan.description!,

              style: Theme.of(context).textTheme.bodySmall?.copyWith(

                    color: AppColors.mutedForeground,

                  ),

            ),

          ],

          const SizedBox(height: 12),

          Text(

            priceLabel,

            style: Theme.of(context).textTheme.titleMedium?.copyWith(

                  color: AppColors.primary,

                  fontWeight: FontWeight.w700,

                ),

          ),

          Text(

            creditsLabel,

            style: Theme.of(context).textTheme.bodySmall?.copyWith(

                  color: AppColors.mutedForeground,

                ),

          ),

          if (plan.features.isNotEmpty) ...[

            const SizedBox(height: 12),

            ...plan.features.take(4).map(

                  (f) => Padding(

                    padding: const EdgeInsets.only(bottom: 6),

                    child: Row(

                      crossAxisAlignment: CrossAxisAlignment.start,

                      children: [

                        const Icon(

                          Icons.check_circle_outline,

                          size: 16,

                          color: AppColors.success,

                        ),

                        const SizedBox(width: 8),

                        Expanded(

                          child: Text(

                            f,

                            style: Theme.of(context).textTheme.bodySmall,

                          ),

                        ),

                      ],

                    ),

                  ),

                ),

          ],

          const SizedBox(height: 14),

          GradientCtaButton(

            label: isCurrent ? 'Gói hiện tại' : 'Chọn gói',

            expand: true,

            onPressed: onSelect,

          ),

        ],

      ),

    );

  }

}


