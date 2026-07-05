import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/billing_models.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import 'checkout_kind.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/checkout_success_view.dart';
import '../../widgets/common_widgets.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen._({
    super.key,
    required this.kind,
    this.planSlug,
    this.packId,
  });

  const CheckoutScreen.subscription({
    Key? key,
    required String planSlug,
  }) : this._(key: key, kind: CheckoutKind.subscription, planSlug: planSlug);

  const CheckoutScreen.credits({
    Key? key,
    required String packId,
  }) : this._(key: key, kind: CheckoutKind.credits, packId: packId);

  const CheckoutScreen.assets({Key? key})
      : this._(key: key, kind: CheckoutKind.assets);

  final CheckoutKind kind;
  final String? planSlug;
  final String? packId;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _loading = true;
  String? _error;
  SubscriptionPlan? _plan;
  CreditPack? _pack;
  Order? _order;
  BankTransferInfo? _bank;

  int get _amountVnd {
    if (widget.kind == CheckoutKind.subscription) return _plan?.priceVnd ?? 0;
    if (widget.kind == CheckoutKind.credits) return _pack?.priceVnd ?? 0;
    return _order?.totalVnd ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final auth = ref.read(authProvider);
    if (!auth.isLoggedIn) {
      if (mounted) context.go('/auth');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final orders = await ref.read(ordersServiceProvider.future);
      if (widget.kind == CheckoutKind.subscription) {
        final sub = await ref.read(subscriptionServiceProvider.future);
        _plan = await sub.fetchPlanBySlug(widget.planSlug!);
        if (_plan!.priceVnd > 0) {
          _order = await orders.createSubscriptionOrder(_plan!.id);
        }
      } else if (widget.kind == CheckoutKind.credits) {
        final packs = await ref.read(creditPackServiceProvider.future);
        final list = await packs.fetchPacks();
        _pack = list.firstWhere((p) => p.id == widget.packId);
        _order = await orders.createCreditPackOrder(_pack!.id);
      } else {
        _order = await orders.createAssetOrder();
      }

      if (_order != null && _amountVnd > 0) {
        final payments = await ref.read(paymentsServiceProvider.future);
        _bank = await payments.fetchBankTransferInfo(
          amountVnd: _amountVnd,
          transferMemo: _order!.orderCode,
        );
      }

      if (_order?.isCompleted == true) {
        await ref.read(authProvider.notifier).refreshUser();
      }

      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = friendlyErrorMessage(e);
      });
    }
  }

  String get _itemLabel => switch (widget.kind) {
        CheckoutKind.subscription => _plan?.name ?? 'Gói đăng ký',
        CheckoutKind.credits => _pack?.name ?? 'Gói xu',
        CheckoutKind.assets => 'Asset trong giỏ',
      };

  Future<void> _confirmTransfer() async {
    final order = _order;
    if (order == null) return;

    try {
      final orders = await ref.read(ordersServiceProvider.future);
      await orders.reportBankTransfer(order.id);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(friendlyErrorMessage(e)),
          backgroundColor: AppColors.destructive,
        ),
      );
      return;
    }

    if (!mounted) return;
    context.go(
      '/checkout/waiting/${order.id}'
      '?orderCode=${Uri.encodeComponent(order.orderCode)}'
      '&label=${Uri.encodeComponent(_itemLabel)}',
    );
  }

  Future<void> _copy(String text, String label) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã copy $label')),
    );
  }

  String get _screenTitle => switch (widget.kind) {
        CheckoutKind.subscription => 'Thanh toán gói',
        CheckoutKind.credits => 'Mua gói xu',
        CheckoutKind.assets => 'Thanh toán asset',
      };

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final isSuccess = !_loading && _error == null && _order?.isCompleted == true;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leadingWidth: 0,
        titleSpacing: AppSpacing.page,
        centerTitle: false,
        backgroundColor: AppColors.background.withValues(alpha: 0.98),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 2,
        shadowColor: AppColors.border,
        title: isSuccess
            ? Text(
                'Hoàn tất',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              )
            : _CheckoutBackTitle(title: _screenTitle),
      ),
      body: SiteBackground(
        child: _loading
            ? const LoadingView()
            : _error != null
                ? Padding(
                    padding: const EdgeInsets.all(AppSpacing.xxl),
                    child: AppCard(
                      child: EmptyState(
                        icon: Icons.error_outline_rounded,
                        title: 'Không tạo được đơn',
                        subtitle: _error,
                        action: GradientCtaButton(
                          label: 'Quay lại',
                          expand: false,
                          onPressed: () => context.pop(),
                        ),
                      ),
                    ),
                  )
                : isSuccess
                    ? CheckoutSuccessView(
                        kind: widget.kind,
                        itemLabel: _itemLabel,
                        order: _order,
                        amountVnd: _amountVnd,
                        fmt: fmt,
                      )
                    : ListView(
                        padding: EdgeInsets.fromLTRB(
                          AppSpacing.page,
                          AppSpacing.md,
                          AppSpacing.page,
                          _bank != null ? 120 : AppSpacing.pageBottom,
                        ),
                        children: [
                          _OrderHero(
                            kind: widget.kind,
                            plan: _plan,
                            pack: _pack,
                            order: _order,
                            amountVnd: _amountVnd,
                            fmt: fmt,
                          ),
                          if (_amountVnd == 0) ...[
                            const SizedBox(height: AppSpacing.xl),
                            GradientCtaButton(
                              label: 'Hoàn tất',
                              onPressed: () => context.go('/'),
                            ),
                          ] else if (_bank != null) ...[
                            const SizedBox(height: AppSpacing.xl),
                            const _PaymentSteps(),
                            const SizedBox(height: AppSpacing.lg),
                            _PaymentPanel(
                              bank: _bank!,
                              order: _order!,
                              amountVnd: _amountVnd,
                              fmt: fmt,
                              onCopy: _copy,
                            ),
                          ],
                        ],
                      ),
      ),
      bottomNavigationBar: _loading ||
              _error != null ||
              _order?.isCompleted == true ||
              _amountVnd == 0 ||
              _bank == null
          ? null
          : _CheckoutFooter(
              amountVnd: _amountVnd,
              fmt: fmt,
              onConfirm: _confirmTransfer,
            ),
    );
  }
}

class _CheckoutBackTitle extends StatelessWidget {
  const _CheckoutBackTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Quay lại',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.pop(),
          borderRadius: BorderRadius.circular(8),
          splashColor: AppColors.primary.withValues(alpha: 0.12),
          highlightColor: AppColors.primary.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: AppSpacing.sm,
              horizontal: AppSpacing.xs,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.arrow_back_rounded),
                const SizedBox(width: AppSpacing.xs),
                Text(title),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OrderHero extends StatelessWidget {
  const _OrderHero({
    required this.kind,
    this.plan,
    this.pack,
    this.order,
    required this.amountVnd,
    required this.fmt,
  });

  final CheckoutKind kind;
  final SubscriptionPlan? plan;
  final CreditPack? pack;
  final Order? order;
  final int amountVnd;
  final NumberFormat fmt;

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;
    final name = switch (kind) {
      CheckoutKind.subscription => plan?.name ?? '',
      CheckoutKind.credits => pack?.name ?? '',
      CheckoutKind.assets => 'Asset trong giỏ',
    };
    final icon = switch (kind) {
      CheckoutKind.subscription => Icons.workspace_premium_outlined,
      CheckoutKind.credits => Icons.monetization_on_outlined,
      CheckoutKind.assets => Icons.shopping_bag_outlined,
    };
    final accent = switch (kind) {
      CheckoutKind.subscription => AppColors.secondary,
      CheckoutKind.credits => AppColors.warning,
      CheckoutKind.assets => AppColors.primary,
    };

    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [accent, AppColors.primary],
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadius.lg),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: accent.withValues(alpha: 0.28),
                        ),
                      ),
                      child: Icon(icon, color: accent, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tóm tắt đơn',
                            style: body.labelSmall?.copyWith(
                              color: AppColors.mutedForeground,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            name,
                            style: body.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          if (kind == CheckoutKind.credits && pack != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              '+${fmt.format(pack!.credits)} xu',
                              style: body.titleSmall?.copyWith(
                                color: AppColors.warning,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (order != null)
                      _StatusChip(status: order!.status),
                  ],
                ),
                if (order != null) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.12),
                          AppColors.secondary.withValues(alpha: 0.08),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.22),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tổng thanh toán',
                                style: body.labelSmall?.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                amountVnd == 0
                                    ? 'Miễn phí'
                                    : '${fmt.format(amountVnd)}đ',
                                style: body.headlineSmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (amountVnd > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.background.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              order!.orderCode,
                              style: body.labelSmall?.copyWith(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
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

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status.toLowerCase()) {
      'pending' => ('Chờ TT', AppColors.warning),
      'completed' => ('Hoàn tất', AppColors.success),
      'cancelled' => ('Đã hủy', AppColors.destructive),
      _ => (status, AppColors.mutedForeground),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 10,
            ),
      ),
    );
  }
}

class _PaymentSteps extends StatelessWidget {
  const _PaymentSteps();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const _StepDot(
          index: 1,
          label: 'Quét QR',
          active: true,
        ),
        Expanded(child: _stepLine(active: false)),
        const _StepDot(
          index: 2,
          label: 'Chuyển khoản',
        ),
        Expanded(child: _stepLine(active: false)),
        const _StepDot(
          index: 3,
          label: 'Xác nhận',
        ),
      ],
    );
  }

  Widget _stepLine({required bool active}) {
    return Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        gradient: active
            ? const LinearGradient(
                colors: [AppColors.primary, AppColors.secondary],
              )
            : null,
        color: active ? null : AppColors.border,
        borderRadius: BorderRadius.circular(999),
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.index,
    required this.label,
    this.active = false,
  });

  final int index;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : AppColors.mutedForeground;

    return SizedBox(
      width: 72,
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: active
                  ? const LinearGradient(
                      colors: [AppColors.primary, AppColors.secondary],
                    )
                  : null,
              color: active ? null : AppColors.card,
              border: Border.all(
                color: active ? Colors.transparent : AppColors.border,
              ),
            ),
            child: Center(
              child: Text(
                '$index',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: active
                          ? AppColors.primaryForeground
                          : AppColors.mutedForeground,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                ),
          ),
        ],
      ),
    );
  }
}

class _PaymentPanel extends StatelessWidget {
  const _PaymentPanel({
    required this.bank,
    required this.order,
    required this.amountVnd,
    required this.fmt,
    required this.onCopy,
  });

  final BankTransferInfo bank;
  final Order order;
  final int amountVnd;
  final NumberFormat fmt;
  final Future<void> Function(String text, String label) onCopy;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.qr_code_2_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chuyển khoản ngân hàng',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(
                      'Quét mã hoặc copy thông tin bên dưới',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (bank.qrUrl != null) ...[
            const SizedBox(height: AppSpacing.lg),
            Center(
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: bank.qrUrl!,
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: AppSpacing.md),
          _CopyField(
            label: 'Ngân hàng',
            value: bank.bankName,
            icon: Icons.account_balance_outlined,
            onCopy: () => onCopy(bank.bankName, 'tên ngân hàng'),
          ),
          _CopyField(
            label: 'Số tài khoản',
            value: bank.accountNumber,
            icon: Icons.numbers_rounded,
            onCopy: () => onCopy(bank.accountNumber, 'số tài khoản'),
          ),
          _CopyField(
            label: 'Chủ tài khoản',
            value: bank.accountHolder,
            icon: Icons.person_outline_rounded,
            onCopy: () => onCopy(bank.accountHolder, 'chủ tài khoản'),
          ),
          _CopyField(
            label: 'Số tiền',
            value: '${fmt.format(amountVnd)}đ',
            icon: Icons.payments_outlined,
            highlight: true,
            onCopy: () => onCopy('$amountVnd', 'số tiền'),
          ),
          _CopyField(
            label: 'Nội dung chuyển khoản',
            value: order.orderCode,
            icon: Icons.tag_outlined,
            highlight: true,
            onCopy: () => onCopy(order.orderCode, 'nội dung'),
          ),
        ],
      ),
    );
  }
}

class _CheckoutFooter extends StatelessWidget {
  const _CheckoutFooter({
    required this.amountVnd,
    required this.fmt,
    required this.onConfirm,
  });

  final int amountVnd;
  final NumberFormat fmt;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.background.withValues(alpha: 0.97),
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.border.withValues(alpha: 0.8)),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.page,
              AppSpacing.md,
              AppSpacing.page,
              AppSpacing.md,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      'Cần chuyển',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    const Spacer(),
                    Text(
                      '${fmt.format(amountVnd)}đ',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.warning,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                GradientCtaButton(
                  label: 'Tôi đã chuyển khoản',
                  icon: Icons.check_circle_outline_rounded,
                  onPressed: onConfirm,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CopyField extends StatelessWidget {
  const _CopyField({
    required this.label,
    required this.value,
    required this.icon,
    required this.onCopy,
    this.highlight = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onCopy;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final accent = highlight ? AppColors.primary : AppColors.mutedForeground;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onCopy,
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: highlight
                  ? AppColors.primary.withValues(alpha: 0.08)
                  : AppColors.background.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: highlight
                    ? AppColors.primary.withValues(alpha: 0.28)
                    : AppColors.border.withValues(alpha: 0.8),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppColors.mutedForeground,
                              fontSize: 10,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        value,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: highlight
                                  ? AppColors.primary
                                  : AppColors.foreground,
                            ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.card.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(
                    Icons.copy_rounded,
                    size: 16,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
