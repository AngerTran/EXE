import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/notification_providers.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/checkout_success_view.dart';
import '../../widgets/common_widgets.dart';
import 'checkout_kind.dart';

class CheckoutWaitingScreen extends ConsumerStatefulWidget {
  const CheckoutWaitingScreen({
    super.key,
    required this.orderId,
    required this.orderCode,
    required this.itemLabel,
  });

  final String orderId;
  final String orderCode;
  final String itemLabel;

  @override
  ConsumerState<CheckoutWaitingScreen> createState() =>
      _CheckoutWaitingScreenState();
}

class _CheckoutWaitingScreenState extends ConsumerState<CheckoutWaitingScreen> {
  bool _completed = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_reportTransferIfNeeded());
    });
    _startPolling();
  }

  Future<void> _reportTransferIfNeeded() async {
    try {
      final orders = await ref.read(ordersServiceProvider.future);
      final current = await orders.fetchOrderById(widget.orderId);
      if (current.hasReportedTransfer) return;
      await orders.reportBankTransfer(widget.orderId);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không ghi nhận được chuyển khoản. Vui lòng thử lại.'),
          backgroundColor: AppColors.destructive,
        ),
      );
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Đã ghi nhận chuyển khoản. Gói/xu sẽ kích hoạt sau khi được xác nhận.',
        ),
        duration: Duration(seconds: 4),
      ),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    unawaited(_checkOrder());
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      unawaited(_checkOrder());
    });
  }

  Future<void> _checkOrder() async {
    if (_completed || !mounted) return;
    try {
      final orders = await ref.read(ordersServiceProvider.future);
      final updated = await orders.fetchOrderById(widget.orderId);
      if (!mounted || !updated.isCompleted) return;

      _pollTimer?.cancel();
      await ref.read(authProvider.notifier).refreshUser();
      ref.invalidate(cartProvider);
      await ref.read(notificationProvider.notifier).refresh();
      if (!mounted) return;
      setState(() => _completed = true);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thanh toán thành công! Gói/xu đã được kích hoạt.'),
          backgroundColor: AppColors.success,
          duration: Duration(seconds: 4),
        ),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;

    if (_completed) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Hoàn tất'),
          centerTitle: false,
          automaticallyImplyLeading: false,
          backgroundColor: AppColors.background.withValues(alpha: 0.98),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
        ),
        body: SiteBackground(
          child: CheckoutSuccessView(
            kind: CheckoutKind.subscription,
            itemLabel: widget.itemLabel,
            orderCode: widget.orderCode,
            subtitle:
                '${widget.itemLabel} đã được kích hoạt. Số xu trên tài khoản đã được cập nhật.',
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đang chờ xác nhận'),
        centerTitle: false,
        backgroundColor: AppColors.background.withValues(alpha: 0.98),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SiteBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.page,
                    vertical: AppSpacing.lg,
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: AppSpacing.xl),
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.warning.withValues(alpha: 0.12),
                          border: Border.all(
                            color: AppColors.warning.withValues(alpha: 0.4),
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.schedule_rounded,
                          size: 48,
                          color: AppColors.warning,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        'Đang chờ xác nhận',
                        style: body.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Bạn đã báo chuyển khoản cho ${widget.itemLabel}.',
                        style: body.bodyMedium?.copyWith(
                          color: AppColors.mutedForeground,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      AppCard(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Mã đơn',
                              style: body.labelSmall?.copyWith(
                                color: AppColors.mutedForeground,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              widget.orderCode,
                              style: body.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                                fontFamily: 'monospace',
                              ),
                            ),
                            const SizedBox(height: AppSpacing.md),
                            const Divider(height: 1, color: AppColors.border),
                            const SizedBox(height: AppSpacing.md),
                            Text(
                              'Sau khi hệ thống đối soát thành công, gói và xu sẽ được kích hoạt tự động. Thường mất từ vài phút đến 24 giờ.',
                              style: body.bodySmall?.copyWith(
                                color: AppColors.mutedForeground,
                                height: 1.45,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color:
                                        AppColors.primary.withValues(alpha: 0.85),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Đang kiểm tra trạng thái mỗi 5 giây...',
                                  style: body.labelSmall?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.page,
                  AppSpacing.sm,
                  AppSpacing.page,
                  AppSpacing.pageBottom,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    GradientCtaButton(
                      label: 'Xem đơn hàng',
                      icon: Icons.receipt_long_outlined,
                      onPressed: () => context.go('/orders'),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () => context.go('/'),
                      icon: const Icon(Icons.home_rounded, size: 18),
                      label: const Text('Về trang chủ'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.foreground,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
