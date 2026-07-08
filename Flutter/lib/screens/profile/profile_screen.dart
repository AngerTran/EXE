import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/auth_models.dart';
import '../../core/utils/purchase_history.dart';
import '../../models/billing_models.dart';
import '../../models/commerce_models.dart';
import '../../providers/notification_providers.dart';
import '../../providers/service_providers.dart';
import '../../screens/profile/purchase_history_screen.dart';
import '../../widgets/common_widgets.dart';

class _PurchasePreview {
  const _PurchasePreview({required this.orders, required this.hasMore});

  final List<Order> orders;
  final bool hasMore;
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final purchases = ref.watch(_recentPurchasesProvider);
    final subscriptionHistory = ref.watch(_subscriptionHistoryProvider);
    final subscriptionMe = ref.watch(_subscriptionMeProvider);
    final notificationsEnabled = ref.watch(
      notificationProvider.select((s) => s.alertsEnabled),
    );

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
    final subMe = subscriptionMe.maybeWhen(data: (d) => d, orElse: () => null);

    return SafeArea(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await ref.read(authProvider.notifier).refreshUser();
          ref.invalidate(_recentPurchasesProvider);
          ref.invalidate(_subscriptionHistoryProvider);
          ref.invalidate(_subscriptionMeProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.md,
            AppSpacing.page,
            AppSpacing.xxl,
          ),
          children: [
            _ProfileHeader(
              user: user,
              onEdit: () => context.push('/profile/edit'),
            ),
            const SizedBox(height: AppSpacing.xl),
            _WalletPanel(
              user: user,
              subscriptionMe: subMe,
              onUpgrade: () => context.go('/pricing'),
              onOrders: () => context.push('/orders'),
              onCancelSubscription: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Hủy gói đăng ký?'),
                    content: const Text(
                      'Bạn sẽ mất quyền lợi gói hiện tại sau khi hủy. Thao tác này không thể hoàn tác.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Không'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text(
                          'Hủy gói',
                          style: TextStyle(color: AppColors.destructive),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm != true) return;
                try {
                  final svc =
                      await ref.read(customerSubscriptionServiceProvider.future);
                  await svc.cancelSubscription();
                  await ref.read(authProvider.notifier).refreshUser();
                  ref.invalidate(_subscriptionHistoryProvider);
                  ref.invalidate(_subscriptionMeProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã hủy gói đăng ký'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(friendlyErrorMessage(e)),
                        backgroundColor: AppColors.destructive,
                      ),
                    );
                  }
                }
              },
            ),
            subscriptionHistory.when(
              data: (history) {
                if (history.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.lg),
                  child: _SubscriptionHistoryStrip(history: history.take(2).toList()),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
            ),
            const SizedBox(height: AppSpacing.xl),
            _QuickActionsGrid(
              onOrders: () => context.push('/orders'),
              onLibrary: () => context.go('/library'),
              onPricing: () => context.go('/pricing'),
              onEdit: () => context.push('/profile/edit'),
            ),
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(title: 'Mua hàng gần đây', compact: true),
            const SizedBox(height: AppSpacing.sm),
            purchases.when(
              data: (preview) {
                if (preview.orders.isEmpty) {
                  return AppCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.xxl,
                    ),
                    child: const EmptyState(
                      icon: Icons.shopping_bag_outlined,
                      title: 'Chưa có giao dịch mua',
                      subtitle:
                          'Gói dịch vụ, nạp xu hoặc mua asset sẽ hiện ở đây.',
                    ),
                  );
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppCard(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      child: Column(
                        children: [
                          for (var i = 0; i < preview.orders.length; i++) ...[
                            if (i > 0)
                              Divider(
                                height: 1,
                                color: AppColors.border.withValues(alpha: 0.6),
                              ),
                            PurchaseOrderRow(
                              order: preview.orders[i],
                              compact: true,
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (preview.hasMore) ...[
                      const SizedBox(height: AppSpacing.sm),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () =>
                              context.push('/profile/purchases'),
                          icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                          label: const Text('Xem tất cả'),
                        ),
                      ),
                    ],
                  ],
                );
              },
              loading: () =>
                  const LoadingView(),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được lịch sử mua',
                onRetry: () => ref.invalidate(_recentPurchasesProvider),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(title: 'Cài đặt', compact: true),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    secondary: Icon(
                      notificationsEnabled
                          ? Icons.notifications_active_outlined
                          : Icons.notifications_off_outlined,
                      color: notificationsEnabled
                          ? AppColors.primary
                          : AppColors.mutedForeground,
                    ),
                    title: const Text('Thông báo trong app'),
                    subtitle: Text(
                      notificationsEnabled
                          ? 'Hiện banner khi có đơn, gói hoặc asset mới'
                          : 'Đã tắt banner — vẫn xem được trong chuông',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    value: notificationsEnabled,
                    activeThumbColor: AppColors.primaryForeground,
                    activeTrackColor: AppColors.primary,
                    onChanged: (value) => ref
                        .read(notificationProvider.notifier)
                        .setAlertsEnabled(value),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(title: 'Hỗ trợ & pháp lý', compact: true),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _SupportLink(
                    icon: Icons.mail_outline_rounded,
                    title: 'Liên hệ',
                    onTap: () => context.push('/contact'),
                  ),
                  Divider(
                    height: 1,
                    color: AppColors.border.withValues(alpha: 0.6),
                  ),
                  _SupportLink(
                    icon: Icons.description_outlined,
                    title: 'Điều khoản sử dụng',
                    onTap: () => context.push('/terms'),
                  ),
                  Divider(
                    height: 1,
                    color: AppColors.border.withValues(alpha: 0.6),
                  ),
                  _SupportLink(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Chính sách bảo mật',
                    onTap: () => context.push('/privacy'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
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
          ],
        ),
      ),
    );
  }
}

String _formatDate(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return DateFormat('dd/MM/yyyy HH:mm').format(d);
  } catch (_) {
    return iso;
  }
}

String _planLabel(String slug) {
  switch (slug.toLowerCase()) {
    case 'pro':
      return 'PRO';
    case 'student':
      return 'STUDENT';
    case 'free':
      return 'FREE';
    default:
      return slug.toUpperCase();
  }
}

final _recentPurchasesProvider =
    FutureProvider<_PurchasePreview>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) {
    return const _PurchasePreview(orders: [], hasMore: false);
  }

  final service = await ref.watch(ordersServiceProvider.future);
  final res = await service.fetchMyOrders(
    page: 1,
    pageSize: profilePurchasePreviewLimit + 1,
  );
  final orders = res.data
      .where((o) => o.isCompleted && isPurchaseOrder(o))
      .toList();
  final hasMore = orders.length > profilePurchasePreviewLimit;

  return _PurchasePreview(
    orders: orders.take(profilePurchasePreviewLimit).toList(),
    hasMore: hasMore,
  );
});

final _subscriptionHistoryProvider =
    FutureProvider<List<SubscriptionHistoryItem>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return [];
  final svc = await ref.watch(customerSubscriptionServiceProvider.future);
  return svc.fetchHistory();
});

final _subscriptionMeProvider = FutureProvider<SubscriptionMe?>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return null;
  final svc = await ref.watch(customerSubscriptionServiceProvider.future);
  try {
    return await svc.fetchMySubscription();
  } catch (_) {
    return null;
  }
});

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user, required this.onEdit});

  final AppUser user;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;

    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 4,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.secondary],
              ),
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(AppRadius.lg),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.secondary],
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 34,
                    backgroundColor: AppColors.card,
                    backgroundImage: user.avatarUrl != null
                        ? NetworkImage(user.avatarUrl!)
                        : null,
                    child: user.avatarUrl == null
                        ? Text(
                            user.name.isNotEmpty
                                ? user.name[0].toUpperCase()
                                : '?',
                            style: body.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          )
                        : null,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: body.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user.email,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: body.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          _PlanBadge(plan: user.subscription),
                          if (user.subscriptionExpiry != null)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.event_outlined,
                                  size: 13,
                                  color: AppColors.mutedForeground,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Hết hạn ${_formatDate(user.subscriptionExpiry!)}',
                                  style: body.labelSmall?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  tooltip: 'Chỉnh sửa hồ sơ',
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.background.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletPanel extends StatelessWidget {
  const _WalletPanel({
    required this.user,
    required this.subscriptionMe,
    required this.onUpgrade,
    required this.onOrders,
    required this.onCancelSubscription,
  });

  final AppUser user;
  final SubscriptionMe? subscriptionMe;
  final VoidCallback onUpgrade;
  final VoidCallback onOrders;
  final Future<void> Function() onCancelSubscription;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final body = Theme.of(context).textTheme;
    final planSlug = subscriptionMe?.planSlug ?? user.subscription;
    final planName = subscriptionMe?.planName ?? _planLabel(planSlug);
    final status = (subscriptionMe?.status ?? '').toLowerCase();
    final expiredAt = subscriptionMe?.expiredAt ?? user.subscriptionExpiry;
    final canCancel = planSlug.toLowerCase() != 'free' && status == 'active';

    String statusLabel() {
      if (status == 'active') return 'Đang hoạt động';
      if (status == 'cancelled') return 'Đã hủy';
      if (status == 'expired') return 'Hết hạn';
      if (status == 'pending') return 'Chờ kích hoạt';
      return '';
    }

    String? expiryText() {
      if (expiredAt == null) return null;
      final formatted = _formatDate(expiredAt);
      if (status == 'expired') return 'Hết hạn $formatted';
      if (status == 'cancelled') return 'Còn hiệu lực đến $formatted';
      if (status == 'active') return 'Hiệu lực đến $formatted';
      return 'Hết hạn $formatted';
    }

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 3,
                height: 16,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [AppColors.warning, AppColors.warning],
                  ),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Ví xu',
                style: body.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _WalletStat(
                    icon: Icons.monetization_on_outlined,
                    iconColor: AppColors.warning,
                    label: 'Số dư',
                    child: user.isUnlimited
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '∞',
                                style: body.headlineMedium?.copyWith(
                                  color: AppColors.warning,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 36,
                                  height: 0.95,
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.only(bottom: 3, left: 2),
                                child: Text(
                                  'xu',
                                  style: body.titleSmall?.copyWith(
                                    color: AppColors.warning,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Text(
                            '${fmt.format(user.credits)} xu',
                            style: body.titleLarge?.copyWith(
                              color: AppColors.warning,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 10),
                Container(width: 1, color: AppColors.border),
                const SizedBox(width: 10),
                Expanded(
                  child: _WalletStat(
                    icon: Icons.workspace_premium_outlined,
                    iconColor: AppColors.secondary,
                    label: 'Gói hiện tại',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          planName,
                          style: body.titleLarge?.copyWith(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        if (statusLabel().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              statusLabel(),
                              style: body.labelSmall?.copyWith(
                                color: AppColors.mutedForeground,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        if (expiryText() != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              expiryText()!,
                              style: body.labelSmall?.copyWith(
                                color: AppColors.mutedForeground,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (user.isUnlimited && planSlug.toLowerCase() != 'free') ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.secondary.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.all_inclusive_rounded,
                    size: 16,
                    color: AppColors.secondary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Xu không giới hạn với gói $planName',
                      style: body.labelSmall?.copyWith(
                        color: AppColors.secondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onUpgrade,
                  icon: const Icon(Icons.auto_awesome_outlined, size: 18),
                  label: const Text('Nâng cấp gói'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(
                      color: AppColors.primary.withValues(alpha: 0.4),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onOrders,
                  icon: const Icon(Icons.receipt_long_outlined, size: 18),
                  label: const Text('Đơn hàng'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
          if (canCancel) ...[
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: () => onCancelSubscription(),
              icon: const Icon(Icons.cancel_outlined, size: 18),
              label: const Text('Hủy gói'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.destructive,
                side: BorderSide(
                  color: AppColors.destructive.withValues(alpha: 0.5),
                ),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WalletStat extends StatelessWidget {
  const _WalletStat({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.child,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: iconColor),
              const SizedBox(width: 5),
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.onOrders,
    required this.onLibrary,
    required this.onPricing,
    required this.onEdit,
  });

  final VoidCallback onOrders;
  final VoidCallback onLibrary;
  final VoidCallback onPricing;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickActionTile(
            icon: Icons.receipt_long_outlined,
            label: 'Đơn hàng',
            color: AppColors.primary,
            onTap: onOrders,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _QuickActionTile(
            icon: Icons.folder_special_outlined,
            label: 'Thư viện',
            color: AppColors.secondary,
            onTap: onLibrary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _QuickActionTile(
            icon: Icons.workspace_premium_outlined,
            label: 'Gói dịch vụ',
            color: AppColors.warning,
            onTap: onPricing,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _QuickActionTile(
            icon: Icons.person_outline_rounded,
            label: 'Hồ sơ',
            color: AppColors.mutedForeground,
            onTap: onEdit,
          ),
        ),
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.75),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SubscriptionHistoryStrip extends StatelessWidget {
  const _SubscriptionHistoryStrip({required this.history});

  final List<SubscriptionHistoryItem> history;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Lịch sử gói',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          for (var i = 0; i < history.length; i++) ...[
            if (i > 0) const SizedBox(height: 6),
            Row(
              children: [
                Icon(
                  Icons.history_rounded,
                  size: 14,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    history[i].planName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                Text(
                  history[i].status,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SupportLink extends StatelessWidget {
  const _SupportLink({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.mutedForeground),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.mutedForeground,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

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
        border: Border.all(
          color: AppColors.secondary.withValues(alpha: 0.35),
        ),
      ),
      child: Text(
        _planLabel(plan),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.secondary,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
