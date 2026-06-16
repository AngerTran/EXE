import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
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
        _error = e.toString();
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
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
              ? EmptyState(
                  icon: Icons.error_outline,
                  title: 'Không tạo được đơn',
                  subtitle: _error,
                  action: GradientCtaButton(
                    label: 'Quay lại',
                    expand: false,
                    onPressed: () => context.pop(),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_order?.isCompleted == true) ...[
                      const Icon(Icons.check_circle,
                          color: AppColors.success, size: 56),
                      const SizedBox(height: 12),
                      Text(
                        'Đơn đã hoàn tất',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 24),
                      GradientCtaButton(
                        label: 'Về trang chủ',
                        onPressed: () => context.go('/'),
                      ),
                    ] else ...[
                      _SummaryCard(
                        kind: widget.kind,
                        plan: _plan,
                        pack: _pack,
                        order: _order,
                        fmt: fmt,
                      ),
                      if (_amountVnd == 0) ...[
                        const SizedBox(height: 16),
                        GradientCtaButton(
                          label: 'Hoàn tất',
                          onPressed: () => context.go('/'),
                        ),
                      ] else if (_bank != null) ...[
                        const SizedBox(height: 20),
                        SectionHeader(title: 'Chuyển khoản ngân hàng'),
                        if (_bank!.qrUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: _bank!.qrUrl!,
                              height: 220,
                              fit: BoxFit.contain,
                            ),
                          ),
                        const SizedBox(height: 12),
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
                          onCopy: () =>
                              _copy('$_amountVnd', 'số tiền'),
                        ),
                        _BankRow(
                          label: 'Nội dung CK',
                          value: _order!.orderCode,
                          onCopy: () => _copy(_order!.orderCode, 'nội dung'),
                        ),
                        const SizedBox(height: 20),
                        GradientCtaButton(
                          label: _submitted
                              ? 'Đang chờ xác nhận...'
                              : 'Tôi đã chuyển khoản',
                          onPressed: _submitted ? null : _confirmTransfer,
                        ),
                        if (_submitted)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(
                              'Hệ thống sẽ tự kiểm tra trạng thái đơn mỗi 5 giây.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: AppColors.mutedForeground),
                            ),
                          ),
                      ],
                    ],
                  ],
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
    required this.fmt,
  });

  final CheckoutKind kind;
  final SubscriptionPlan? plan;
  final CreditPack? pack;
  final Order? order;
  final NumberFormat fmt;

  @override
  Widget build(BuildContext context) {
    final name = switch (kind) {
      CheckoutKind.subscription => plan?.name ?? '',
      CheckoutKind.credits => pack?.name ?? '',
      CheckoutKind.assets => 'Asset trong giỏ',
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(name, style: Theme.of(context).textTheme.titleMedium),
          if (order != null) ...[
            const SizedBox(height: 6),
            Text(
              'Mã đơn: ${order!.orderCode}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
            Text(
              'Trạng thái: ${order!.status}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if (kind == CheckoutKind.credits && pack != null)
            Text('${fmt.format(pack!.credits)} xu'),
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
  });

  final String label;
  final String value;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.mutedForeground,
                        )),
                Text(value, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy, size: 18),
            onPressed: onCopy,
          ),
        ],
      ),
    );
  }
}
