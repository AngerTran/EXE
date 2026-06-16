import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../config/app_config.dart';
import '../../core/theme/app_colors.dart';
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
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.card.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: EmptyState(
                icon: Icons.person_outline,
                title: 'Hồ sơ của bạn',
                subtitle: 'Đăng nhập để xem ví xu, gói dịch vụ và lịch sử.',
                action: GradientCtaButton(
                  label: 'Đăng nhập',
                  icon: Icons.login,
                  onPressed: () => context.push('/auth'),
                ),
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
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.1),
                    AppColors.secondary.withValues(alpha: 0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
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
            const SizedBox(height: 20),
            SectionHeader(title: 'Ví xu'),
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
            const SizedBox(height: 24),
            SectionHeader(title: 'Giao dịch gần đây'),
            transactions.when(
              data: (txs) {
                if (txs.isEmpty) {
                  return Text(
                    'Chưa có giao dịch.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  );
                }
                return Column(
                  children: txs
                      .take(10)
                      .map(
                        (tx) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: tx.amount >= 0
                                ? AppColors.success.withValues(alpha: 0.15)
                                : AppColors.destructive.withValues(alpha: 0.15),
                            child: Icon(
                              tx.amount >= 0
                                  ? Icons.add
                                  : Icons.remove,
                              color: tx.amount >= 0
                                  ? AppColors.success
                                  : AppColors.destructive,
                              size: 18,
                            ),
                          ),
                          title: Text(
                            tx.description ?? tx.type,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            _formatDate(tx.createdAt),
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.mutedForeground),
                          ),
                          trailing: Text(
                            '${tx.amount >= 0 ? '+' : ''}${tx.amount}',
                            style: TextStyle(
                              color: tx.amount >= 0
                                  ? AppColors.success
                                  : AppColors.destructive,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const LinearProgressIndicator(
                color: AppColors.primary,
              ),
              error: (e, _) => Text(e.toString()),
            ),
            const SizedBox(height: 24),
            SectionHeader(title: 'Đơn hàng & gói'),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.receipt_long_outlined),
              title: const Text('Lịch sử đơn hàng'),
              trailing: const Icon(Icons.chevron_right),
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
            const SizedBox(height: 16),
            SectionHeader(title: 'Hỗ trợ & pháp lý'),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.mail_outline),
              title: const Text('Liên hệ'),
              onTap: () => context.push('/contact'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.description_outlined),
              title: const Text('Điều khoản'),
              onTap: () => context.push('/terms'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.privacy_tip_outlined),
              title: const Text('Bảo mật'),
              onTap: () => context.push('/privacy'),
            ),
            const SizedBox(height: 16),
            GradientCtaButton(
              label: 'Xem gói dịch vụ',
              icon: Icons.workspace_premium_outlined,
              onPressed: () => context.go('/pricing'),
            ),
            const SizedBox(height: 12),
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
            const SizedBox(height: 16),
            Text(
              'API: ${AppConfig.apiBaseUrl}',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.muted,
                  ),
            ),
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
