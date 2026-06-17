import 'dart:async';

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
import '../../widgets/common_widgets.dart';

enum CheckoutKind { subscription, credits, assets }

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen._({
    Key? key,
    required this.kind,
    this.planSlug,
    this.packId,
  }) : super(key: key);

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
  bool _submitted = false;
  Timer? _pollTimer;

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

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
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

  void _startPolling() {
    _pollTimer?.cancel();
    if (_order == null) return;
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        final orders = await ref.read(ordersServiceProvider.future);
        final updated = await orders.fetchOrderById(_order!.id);
        if (!mounted) return;
        if (updated.isCompleted) {
          _pollTimer?.cancel();
          await ref.read(authProvider.notifier).refreshUser();
          ref.invalidate(cartProvider);
          setState(() => _order = updated);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Thanh toán thành công!'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } catch (_) {}
    });
  }

  void _confirmTransfer() {
    setState(() => _submitted = true);
    _startPolling();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Đã ghi nhận. Gói/xu sẽ được kích hoạt sau khi xác nhận chuyển khoản.',
        ),
      ),
    );
  }

  Future<void> _copy(String text, String label) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã copy $label')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final title = switch (widget.kind) {
      CheckoutKind.subscription => 'Thanh toán gói',
      CheckoutKind.credits => 'Mua gói xu',
      CheckoutKind.assets => 'Thanh toán asset',
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _loading
          ? const LoadingView(message: 'Đang tạo đơn hàng...')
          : _error != null
              ? EmptyState(
                  icon: Icons.error_outline_rounded,
                  title: 'Không tạo được đơn',
                  subtitle: _error,
                  action: GradientCtaButton(
                    label: 'Quay lại',
                    expand: false,
                    onPressed: () => context.pop(),
                  ),
                )
              : _order?.isCompleted == true
                  ? Padding(
                      padding: const EdgeInsets.all(AppSpacing.xxl),
                      child: AppCard(
                        child: EmptyState(
                          icon: Icons.check_circle_rounded,
                          title: 'Thanh toán thành công!',
                          subtitle: 'Đơn hàng đã được xử lý.',
                          action: GradientCtaButton(
                            label: 'Về trang chủ',
                            icon: Icons.home_rounded,
                            expand: false,
                            onPressed: () => context.go('/'),
                          ),
                        ),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.page,
                        AppSpacing.sm,
                        AppSpacing.page,
                        120,
                      ),
                      children: [
                        _SummaryCard(
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
                          const SizedBox(height: AppSpacing.xxl),
                          const SectionHeader(
                            title: 'Chuyển khoản',
                            subtitle: 'Quét QR hoặc copy thông tin bên dưới',
                            compact: true,
                          ),
                          if (_bank!.qrUrl != null)
                            AppCard(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              child: ClipRRect(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.md),
                                child: CachedNetworkImage(
                                  imageUrl: _bank!.qrUrl!,
                                  height: 220,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          const SizedBox(height: AppSpacing.md),
                          _BankRow(
                            label: 'Ngân hàng',
                            value: _bank!.bankName,
                            onCopy: () => _copy(_bank!.bankName, 'tên ngân hàng'),
                          ),
                          _BankRow(
                            label: 'Số tài khoản',
                            value: _bank!.accountNumber,
                            onCopy: () =>
                                _copy(_bank!.accountNumber, 'số tài khoản'),
                          ),
                          _BankRow(
                            label: 'Chủ tài khoản',
                            value: _bank!.accountHolder,
                            onCopy: () =>
                                _copy(_bank!.accountHolder, 'chủ tài khoản'),
                          ),
                          _BankRow(
                            label: 'Số tiền',
                            value: '${fmt.format(_amountVnd)}đ',
                            highlight: true,
                            onCopy: () => _copy('$_amountVnd', 'số tiền'),
                          ),
                          _BankRow(
                            label: 'Nội dung CK',
                            value: _order!.orderCode,
                            highlight: true,
                            onCopy: () => _copy(_order!.orderCode, 'nội dung'),
                          ),
                        ],
                      ],
                    ),
      bottomNavigationBar: _loading ||
              _error != null ||
              _order?.isCompleted == true ||
              _amountVnd == 0 ||
              _bank == null
          ? null
          : Material(
              color: AppColors.background.withValues(alpha: 0.97),
              child: Container(
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.border)),
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
                        if (_submitted)
                          Padding(
                            padding:
                                const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: Text(
                              'Đang kiểm tra trạng thái mỗi 5 giây...',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(color: AppColors.mutedForeground),
                            ),
                          ),
                        GradientCtaButton(
                          label: _submitted
                              ? 'Đang chờ xác nhận...'
                              : 'Tôi đã chuyển khoản',
                          icon: Icons.check_circle_outline_rounded,
                          onPressed: _submitted ? null : _confirmTransfer,
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
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
    final name = switch (kind) {
      CheckoutKind.subscription => plan?.name ?? '',
      CheckoutKind.credits => pack?.name ?? '',
      CheckoutKind.assets => 'Asset trong giỏ',
    };

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tóm tắt đơn',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            name,
            style: Theme.of(context).primaryTextTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          if (kind == CheckoutKind.credits && pack != null) ...[
            const SizedBox(height: 4),
            Text(
              '${fmt.format(pack!.credits)} xu',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.secondary,
                  ),
            ),
          ],
          if (order != null) ...[
            const SizedBox(height: AppSpacing.md),
            const Divider(color: AppColors.border),
            const SizedBox(height: AppSpacing.sm),
            _SummaryLine(label: 'Mã đơn', value: order!.orderCode),
            _SummaryLine(label: 'Trạng thái', value: order!.status),
            _SummaryLine(
              label: 'Tổng tiền',
              value: amountVnd == 0
                  ? 'Miễn phí'
                  : '${fmt.format(amountVnd)}đ',
              highlight: true,
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
                  color: highlight ? AppColors.primary : AppColors.foreground,
                ),
          ),
        ],
      ),
    );
  }
}

class _BankRow extends StatelessWidget {
  const _BankRow({
    required this.label,
    required this.value,
    required this.onCopy,
    this.highlight = false,
  });

  final String label;
  final String value;
  final VoidCallback onCopy;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onCopy,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Ink(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.md,
            ),
            decoration: BoxDecoration(
              color: highlight
                  ? AppColors.primary.withValues(alpha: 0.08)
                  : AppColors.card.withValues(alpha: 0.75),
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: highlight
                    ? AppColors.primary.withValues(alpha: 0.35)
                    : AppColors.border,
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        value,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight:
                                  highlight ? FontWeight.w700 : FontWeight.w500,
                              color: highlight ? AppColors.primary : null,
                            ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.copy_rounded,
                    size: 18, color: AppColors.mutedForeground),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
