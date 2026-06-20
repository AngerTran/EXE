import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_tokens.dart';
import '../core/utils/notification_routes.dart';
import '../models/notification_models.dart';
import '../providers/notification_providers.dart';

Future<void> showNotificationPanel(BuildContext context, WidgetRef ref) async {
  await ref.read(notificationProvider.notifier).refresh();
  await ref.read(notificationProvider.notifier).markAllRead();

  if (!context.mounted) return;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.background,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.82,
      minChildSize: 0.45,
      maxChildSize: 0.92,
      builder: (_, scrollController) => _NotificationPanelBody(
        scrollController: scrollController,
      ),
    ),
  );
}

class NotificationBellButton extends ConsumerWidget {
  const NotificationBellButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(notificationProvider);
    final unread = ref.watch(
      notificationProvider.select((s) => s.unreadCount),
    );

    return IconButton(
      tooltip: 'Thông báo',
      onPressed: () => showNotificationPanel(context, ref),
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text(unread > 9 ? '9+' : '$unread'),
        child: Icon(
          unread > 0
              ? Icons.notifications_rounded
              : Icons.notifications_outlined,
          color: unread > 0 ? AppColors.primary : null,
        ),
      ),
    );
  }
}

class _NotificationPanelBody extends ConsumerWidget {
  const _NotificationPanelBody({required this.scrollController});

  final ScrollController scrollController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationProvider);
    final body = Theme.of(context).textTheme;

    return Column(
      children: [
        const SizedBox(height: AppSpacing.sm),
        Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.lg,
            AppSpacing.page,
            AppSpacing.sm,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.28),
                  ),
                ),
                child: const Icon(Icons.notifications_rounded,
                    color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thông báo',
                      style: body.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Gói dịch vụ, xu, mua asset và hoạt động tài khoản',
                      style: body.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (state.items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        ref.read(notificationProvider.notifier).markAllRead(),
                    icon: const Icon(Icons.done_all_rounded, size: 18),
                    label: const Text('Đã đọc tất cả'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        ref.read(notificationProvider.notifier).clearAll(),
                    icon: const Icon(Icons.delete_outline_rounded, size: 18),
                    label: const Text('Xóa tất cả'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.destructive,
                      side: const BorderSide(color: AppColors.destructive),
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: AppSpacing.sm),
        Expanded(
          child: state.isLoading && state.items.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : state.items.isEmpty
                  ? _EmptyNotifications(alertsEnabled: state.alertsEnabled)
                  : ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.page,
                        AppSpacing.sm,
                        AppSpacing.page,
                        AppSpacing.xxl,
                      ),
                      itemCount: state.items.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, index) {
                        final item = state.items[index];
                        return _NotificationTile(item: item);
                      },
                    ),
        ),
      ],
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications({required this.alertsEnabled});

  final bool alertsEnabled;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              alertsEnabled
                  ? Icons.notifications_off_outlined
                  : Icons.notifications_paused_outlined,
              size: 48,
              color: AppColors.mutedForeground.withValues(alpha: 0.5),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              alertsEnabled ? 'Chưa có thông báo' : 'Banner thông báo đang tắt',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              alertsEnabled
                  ? 'Thông báo sẽ xuất hiện khi bạn mua asset, nạp xu hoặc đơn được xác nhận.'
                  : 'Bạn vẫn xem được lịch sử tại đây. Bật lại trong Hồ sơ → Cài đặt.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                    height: 1.4,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.item});

  final AppNotification item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accent = switch (item.type) {
      'success' => AppColors.success,
      'error' => AppColors.destructive,
      'warning' => AppColors.warning,
      _ => AppColors.primary,
    };

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () async {
          await ref.read(notificationProvider.notifier).markRead(item.id);
          if (!context.mounted) return;
          Navigator.of(context).pop();
          final route = flutterRouteForNotificationAction(item.actionUrl);
          if (route != null) context.go(route);
        },
        child: Ink(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: item.read
                ? AppColors.card.withValues(alpha: 0.45)
                : AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: item.read
                  ? AppColors.border.withValues(alpha: 0.8)
                  : AppColors.primary.withValues(alpha: 0.28),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: accent.withValues(alpha: 0.3)),
                ),
                child: Icon(_iconForType(item.type), size: 18, color: accent),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    if (item.description != null &&
                        item.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.description!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                              height: 1.35,
                            ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      _formatTime(item.createdAt),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColors.mutedForeground,
                            fontSize: 10,
                          ),
                    ),
                  ],
                ),
              ),
              if (!item.read)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _iconForType(String type) => switch (type) {
        'success' => Icons.check_circle_outline_rounded,
        'error' => Icons.error_outline_rounded,
        'warning' => Icons.warning_amber_rounded,
        _ => Icons.info_outline_rounded,
      };

  String _formatTime(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return DateFormat('dd/MM HH:mm').format(date);
  }
}
