import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/notification_providers.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';

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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã ghi nhận chuyển khoản. Gói/xu sẽ kích hoạt sau khi được xác nhận.',
          ),
          duration: Duration(seconds: 4),
        ),
      );
    });
    _startPolling();
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

    return Scaffold(
      appBar: AppBar(
        title: Text(_completed ? 'Thanh toán thành công' : 'Đang chờ xác nhận'),
        centerTitle: false,
        backgroundColor: AppColors.background.withValues(alpha: 0.98),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SiteBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.page),
            child: AppCard(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_completed ? AppColors.success : AppColors.warning)
                          .withValues(alpha: 0.15),
                      border: Border.all(
                        color: (_completed ? AppColors.success : AppColors.warning)
                            .withValues(alpha: 0.35),
                      ),
                    ),
                    child: Icon(
                      _completed
                          ? Icons.check_circle_rounded
                          : Icons.schedule_rounded,
                      size: 40,
                      color:
                          _completed ? AppColors.success : AppColors.warning,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    _completed ? 'Thanh toán thành công!' : 'Đang chờ xác nhận',
                    style: body.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Mã đơn: ${widget.orderCode}',
                    style: body.labelMedium?.copyWith(
                      color: AppColors.mutedForeground,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    _completed
                        ? '${widget.itemLabel} đã được kích hoạt. Số xu trên tài khoản đã được cập nhật.'
                        : 'Bạn đã báo chuyển khoản cho ${widget.itemLabel}.',
                    style: body.bodyMedium?.copyWith(
                      color: AppColors.mutedForeground,
                      height: 1.45,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (!_completed) ...[
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Sau khi hệ thống đối soát thành công, gói và xu sẽ được kích hoạt tự động. Thường mất từ vài phút đến 24 giờ.',
                      style: body.bodySmall?.copyWith(
                        color: AppColors.mutedForeground,
                        height: 1.4,
                      ),
                      textAlign: TextAlign.center,
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
                            color: AppColors.primary.withValues(alpha: 0.85),
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
                  const SizedBox(height: AppSpacing.xl),
                  GradientCtaButton(
                    label: 'Xem đơn hàng',
                    icon: Icons.receipt_long_outlined,
                    onPressed: () => context.go('/orders'),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  GradientCtaButton(
                    label: 'Về trang chủ',
                    icon: Icons.home_rounded,
                    onPressed: () => context.go('/'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
