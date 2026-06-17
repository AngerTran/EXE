import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../models/billing_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final transactions = ref.watch(_walletTxProvider);

    if (!auth.isLoggedIn) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: AppCard(
            child: EmptyState(
              icon: Icons.person_outline_rounded,
              title: 'Hồ sơ của bạn',
              subtitle:
                  'Đăng nhập để xem ví xu, gói dịch vụ và lịch sử giao dịch.',
              action: GradientCtaButton(
                label: 'Đăng nhập',
                icon: Icons.login_rounded,
                onPressed: () => context.push('/auth'),
              ),
            ),
          ),
        ),
      );
    }

    final user = auth.user!;

    return SafeArea(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await ref.read(authProvider.notifier).refreshUser();
          ref.invalidate(_walletTxProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.page),
          children: [
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                    backgroundImage: user.avatarUrl != null
                        ? NetworkImage(user.avatarUrl!)
                        : null,
                    child: user.avatarUrl == null
                        ? Text(
                            user.name.isNotEmpty
                                ? user.name[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        Text(
                          user.email,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                        ),
                        const SizedBox(height: 8),
                        _PlanBadge(plan: user.subscription),
                        if (user.subscriptionExpiry != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Hết hạn: ${_formatDate(user.subscriptionExpiry!)}',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(color: AppColors.mutedForeground),
                          ),
                        ],
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => context.push('/profile/edit'),
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Chỉnh sửa hồ sơ',
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(title: 'Ví xu', compact: true),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    label: 'Số dư',
                    value: user.isUnlimited
                        ? '∞'
                        : NumberFormat.decimalPattern('vi')
                            .format(user.credits),
                    suffix: user.isUnlimited ? '' : ' xu',
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'Gói hiện tại',
                    value: user.subscription.toUpperCase(),
                    color: AppColors.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xxl),
            const SectionHeader(title: 'Giao dịch gần đây', compact: true),
            transactions.when(
              data: (txs) {
                if (txs.isEmpty) {
                  return const EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'Chưa có giao dịch',
                    subtitle: 'Lịch sử nạp xu và mua asset sẽ hiện ở đây.',
                  );
                }
                return Column(
                  children: txs.take(10).map((tx) {
                    return AppMenuTile(
                      icon:
                          tx.amount >= 0 ? Icons.add_rounded : Icons.remove_rounded,
                      title: tx.description ?? tx.type,
                      subtitle: _formatDate(tx.createdAt),
                      trailing: Text(
                        '${tx.amount >= 0 ? '+' : ''}${tx.amount}',
                        style: TextStyle(
                          color: tx.amount >= 0
                              ? AppColors.success
                              : AppColors.destructive,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      onTap: null,
                    );
                  }).toList(),
                );
              },
              loading: () => const LoadingView(message: 'Đang tải giao dịch...'),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được giao dịch',
                onRetry: () => ref.invalidate(_walletTxProvider),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const SectionHeader(title: 'Đơn hàng & gói', compact: true),
            AppMenuTile(
              icon: Icons.receipt_long_outlined,
              title: 'Lịch sử đơn hàng',
              subtitle: 'Xem đơn đã thanh toán',
              onTap: () => context.push('/orders'),
            ),
            ref.watch(_subscriptionHistoryProvider).when(
                  data: (history) {
                    if (history.isEmpty) return const SizedBox.shrink();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        Text(
                          'Lịch sử gói',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        ...history.take(3).map(
                              (h) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                                title: Text(h.planName),
                                subtitle: Text(
                                  '${h.status} · ${_formatDate(h.startedAt)}',
                                ),
                              ),
                            ),
                      ],
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
            const SizedBox(height: AppSpacing.lg),
            const SectionHeader(title: 'Hỗ trợ & pháp lý', compact: true),
            AppMenuTile(
              icon: Icons.mail_outline_rounded,
              title: 'Liên hệ',
              onTap: () => context.push('/contact'),
            ),
            AppMenuTile(
              icon: Icons.description_outlined,
              title: 'Điều khoản sử dụng',
              onTap: () => context.push('/terms'),
            ),
            AppMenuTile(
              icon: Icons.privacy_tip_outlined,
              title: 'Chính sách bảo mật',
              onTap: () => context.push('/privacy'),
            ),
            const SizedBox(height: AppSpacing.lg),
            GradientCtaButton(
              label: 'Xem gói dịch vụ',
              icon: Icons.workspace_premium_outlined,
              onPressed: () => context.go('/pricing'),
            ),
            const SizedBox(height: AppSpacing.md),
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/');
              },
              icon: const Icon(Icons.logout, color: AppColors.destructive),
              label: const Text(
                'Đăng xuất',
                style: TextStyle(color: AppColors.destructive),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.destructive),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      return DateFormat('dd/MM/yyyy HH:mm').format(d);
    } catch (_) {
      return iso;
    }
  }
}

final _walletTxProvider = FutureProvider<List<WalletTransaction>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return [];
  final service = await ref.watch(walletServiceProvider.future);
  final res = await service.fetchTransactions(pageSize: 20);
  return res.data;
});

final _subscriptionHistoryProvider =
    FutureProvider<List<SubscriptionHistoryItem>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return [];
  final svc = await ref.watch(customerSubscriptionServiceProvider.future);
  return svc.fetchHistory();
});

class _PlanBadge extends StatelessWidget {
  const _PlanBadge({required this.plan});

  final String plan;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.secondary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        plan.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.secondary,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    this.suffix = '',
    required this.color,
  });

  final String label;
  final String value;
  final String suffix;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            '$value$suffix',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
