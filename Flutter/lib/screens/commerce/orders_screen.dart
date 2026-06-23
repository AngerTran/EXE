import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _orders = <Order>[];
  bool _loading = false;
  bool _hasMore = true;
  int _page = 1;
  OrdersSummary? _summary;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    try {
      final svc = await ref.read(ordersServiceProvider.future);
      final s = await svc.fetchSummary();
      if (mounted) setState(() => _summary = s);
    } catch (_) {}
  }

  Future<void> _load({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _orders.clear();
      _loadError = null;
    }
    if (!_hasMore) return;
    setState(() => _loading = true);
    try {
      final svc = await ref.read(ordersServiceProvider.future);
      final res = await svc.fetchMyOrders(page: _page);
      setState(() {
        _orders.addAll(res.data);
        _hasMore = _orders.length < res.total;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        if (_orders.isEmpty) {
          _loadError = friendlyErrorMessage(e);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final auth = ref.watch(authProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: _ordersAppBar(context),
        body: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: AppCard(
            child: EmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'Lịch sử đơn hàng',
              subtitle: 'Đăng nhập để xem đơn và trạng thái thanh toán.',
              action: GradientCtaButton(
                label: 'Đăng nhập',
                icon: Icons.login_rounded,
                expand: false,
                onPressed: () => context.push('/auth'),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: _ordersAppBar(context),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await _load(reset: true);
          await _loadSummary();
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.sm,
            AppSpacing.page,
            AppSpacing.pageBottom,
          ),
          children: [
            if (_summary != null) ...[
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Tổng đơn',
                      value: '${_summary!.totalOrders}',
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _StatCard(
                      label: 'Hoàn tất',
                      value: '${_summary!.completedOrders}',
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _StatCard(
                      label: 'Chờ xử lý',
                      value: '${_summary!.pendingOrders}',
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
              if (_summary!.totalSpentVnd > 0) ...[
                const SizedBox(height: AppSpacing.md),
                AppCard(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.payments_outlined,
                        color: AppColors.secondary,
                        size: 22,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          'Tổng chi tiêu',
                          style: Theme.of(context)
                              .textTheme
                              .labelMedium
                              ?.copyWith(color: AppColors.mutedForeground),
                        ),
                      ),
                      Text(
                        '${fmt.format(_summary!.totalSpentVnd)}đ',
                        style: Theme.of(context)
                            .primaryTextTheme
                            .titleSmall
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.secondary,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(
                title: 'Danh sách đơn',
                compact: true,
              ),
            ],
            if (_loadError != null && _orders.isEmpty)
              ErrorState(
                error: _loadError!,
                title: 'Không tải được đơn hàng',
                onRetry: () => _load(reset: true),
              )
            else if (_orders.isEmpty && _loading)
              const Padding(
                padding: EdgeInsets.all(AppSpacing.xxl),
                child: LoadingView(),
              )
            else if (_orders.isEmpty)
              const EmptyState(
                icon: Icons.receipt_long_outlined,
                title: 'Chưa có đơn hàng',
                subtitle: 'Đơn gói dịch vụ, nạp xu hoặc mua asset sẽ hiện ở đây.',
              )
            else
              ..._orders.map(
                (o) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: _OrderCard(order: o, fmt: fmt),
                ),
              ),
            if (_hasMore && _orders.isNotEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: _loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary,
                          ),
                        )
                      : TextButton.icon(
                          onPressed: () => _load(),
                          icon: const Icon(Icons.expand_more_rounded),
                          label: const Text('Tải thêm'),
                        ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.lg,
      ),
      child: Column(
        children: [
          Text(
            value,
            style: Theme.of(context).primaryTextTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.fmt});

  final Order order;
  final NumberFormat fmt;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _typeColor(order.orderType).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  _typeIcon(order.orderType),
                  size: 20,
                  color: _typeColor(order.orderType),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.orderCode,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _orderTypeLabel(order.orderType),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(status: order.status),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.border, height: 1),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: Text(
                  _formatDate(order.createdAt),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                ),
              ),
              Text(
                order.totalVnd == 0
                    ? 'Miễn phí'
                    : '${fmt.format(order.totalVnd)}đ',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static String _formatDate(String iso) {
    try {
      return DateFormat('dd/MM/yyyy HH:mm')
          .format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  static String _orderTypeLabel(String type) {
    return switch (type) {
      'subscription' => 'Gói dịch vụ',
      'credit_pack' => 'Nạp xu',
      'asset' || 'assets' => 'Mua asset',
      _ => type,
    };
  }

  static IconData _typeIcon(String type) {
    return switch (type) {
      'subscription' => Icons.workspace_premium_outlined,
      'credit_pack' => Icons.monetization_on_outlined,
      _ => Icons.shopping_bag_outlined,
    };
  }

  static Color _typeColor(String type) {
    return switch (type) {
      'subscription' => AppColors.secondary,
      'credit_pack' => AppColors.warning,
      _ => AppColors.primary,
    };
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'completed' => ('Hoàn tất', AppColors.success),
      'pending' => ('Chờ xử lý', AppColors.warning),
      'cancelled' || 'canceled' => ('Đã hủy', AppColors.destructive),
      'failed' => ('Thất bại', AppColors.destructive),
      _ => (status, AppColors.mutedForeground),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

PreferredSizeWidget _ordersAppBar(BuildContext context) {
  void onBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  return AppBar(
    automaticallyImplyLeading: false,
    leadingWidth: 0,
    titleSpacing: AppSpacing.page,
    centerTitle: false,
    title: Tooltip(
      message: 'Quay lại',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onBack,
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
                const Text('Đơn hàng'),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
