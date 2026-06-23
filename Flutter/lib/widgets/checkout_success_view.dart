import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_tokens.dart';
import '../../models/commerce_models.dart';
import '../screens/commerce/checkout_kind.dart';
import 'common_widgets.dart';

/// Màn hình kết quả thanh toán — căn giữa nội dung, nút cố định dưới (mobile).
class CheckoutSuccessView extends StatelessWidget {
  const CheckoutSuccessView({
    super.key,
    required this.kind,
    required this.itemLabel,
    this.order,
    this.orderCode,
    this.amountVnd = 0,
    this.fmt,
    this.subtitle,
    this.showViewOrders = true,
  });

  final CheckoutKind kind;
  final String itemLabel;
  final Order? order;
  final String? orderCode;
  final int amountVnd;
  final NumberFormat? fmt;
  final String? subtitle;
  final bool showViewOrders;

  String _resolveSubtitle() => subtitle ?? switch (kind) {
        CheckoutKind.assets =>
          'Asset đã được thêm vào thư viện của bạn. Bạn có thể tải xuống ngay.',
        CheckoutKind.credits =>
          'Xu đã được cộng vào ví. Dùng cho AI advisor và marketplace.',
        CheckoutKind.subscription =>
          'Gói đăng ký đã kích hoạt. Quyền lợi có hiệu lực ngay.',
      };

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;
    final numberFmt = fmt ?? NumberFormat.decimalPattern('vi');

    return SafeArea(
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
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.success.withValues(alpha: 0.12),
                      border: Border.all(
                        color: AppColors.success.withValues(alpha: 0.4),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.success.withValues(alpha: 0.2),
                          blurRadius: 28,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      size: 52,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Thanh toán thành công!',
                    style: body.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.foreground,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    _resolveSubtitle(),
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
                        _SummaryRow(
                          icon: Icons.inventory_2_outlined,
                          label: 'Nội dung',
                          value: itemLabel,
                        ),
                        if (order != null || orderCode != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          const Divider(height: 1, color: AppColors.border),
                          const SizedBox(height: AppSpacing.md),
                          _SummaryRow(
                            icon: Icons.tag_outlined,
                            label: 'Mã đơn',
                            value: order?.orderCode ?? orderCode!,
                            mono: true,
                          ),
                        ],
                        if (amountVnd > 0 || kind == CheckoutKind.assets) ...[
                          const SizedBox(height: AppSpacing.md),
                          const Divider(height: 1, color: AppColors.border),
                          const SizedBox(height: AppSpacing.md),
                          _SummaryRow(
                            icon: Icons.payments_outlined,
                            label: 'Số tiền',
                            value: amountVnd == 0
                                ? 'Miễn phí'
                                : '${numberFmt.format(amountVnd)}đ',
                            valueColor: amountVnd == 0
                                ? AppColors.success
                                : AppColors.primary,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
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
                if (kind == CheckoutKind.assets) ...[
                  GradientCtaButton(
                    label: 'Mở thư viện',
                    icon: Icons.folder_special_rounded,
                    onPressed: () => context.go('/library'),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                ],
                GradientCtaButton(
                  label: 'Về trang chủ',
                  icon: Icons.home_rounded,
                  onPressed: () => context.go('/'),
                ),
                if (showViewOrders) ...[
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/orders'),
                    icon: const Icon(Icons.receipt_long_outlined, size: 18),
                    label: const Text('Xem đơn hàng'),
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
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
    this.mono = false,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool mono;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.mutedForeground),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: body.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: body.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: valueColor ?? AppColors.foreground,
                  fontFamily: mono ? 'monospace' : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
