import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/purchase_history.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';

class PurchaseHistoryScreen extends ConsumerStatefulWidget {
  const PurchaseHistoryScreen({super.key});

  @override
  ConsumerState<PurchaseHistoryScreen> createState() =>
      _PurchaseHistoryScreenState();
}

class _PurchaseHistoryScreenState extends ConsumerState<PurchaseHistoryScreen> {
  final _orders = <Order>[];
  bool _loading = false;
  bool _hasMore = true;
  int _page = 1;
  String? _filter;

  List<Order> get _visibleOrders => _orders
      .where((o) => matchesPurchaseFilter(o, _filter))
      .toList(growable: false);

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  Future<void> _load({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _orders.clear();
    }
    if (!_hasMore) return;

    setState(() => _loading = true);
    try {
      final svc = await ref.read(ordersServiceProvider.future);
      final res = await svc.fetchMyOrders(page: _page, pageSize: 20);
      final purchases = res.data
          .where((o) => o.isCompleted && isPurchaseOrder(o))
          .toList();
      if (!mounted) return;
      setState(() {
        _orders.addAll(purchases);
        _hasMore = res.data.length >= 20;
        _page++;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = computePurchaseStats(_orders);
    final grouped = groupOrdersByDay(_visibleOrders);
    final sortedKeys = grouped.keys.toList()
      ..sort((a, b) => b.compareTo(a));

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Lịch sử mua hàng'),
      ),
      body: SiteBackground(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => _load(reset: true),
          child: _orders.isEmpty && !_loading
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    kToolbarHeight + 16,
                    AppSpacing.page,
                    AppSpacing.pageBottom,
                  ),
                  children: [
                    const _PurchaseHero(
                      stats: PurchaseHistoryStats(
                        total: 0,
                        assets: 0,
                        subscriptions: 0,
                        creditPacks: 0,
                        xuSpent: 0,
                      ),
                    ),
                    SizedBox(height: AppSpacing.xl),
                    EmptyState(
                      icon: Icons.shopping_bag_outlined,
                      title: 'Chưa có giao dịch mua',
                      subtitle:
                          'Gói dịch vụ, nạp xu hoặc mua asset sẽ hiện ở đây.',
                    ),
                  ],
                )
              : ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    kToolbarHeight + 8,
                    AppSpacing.page,
                    AppSpacing.pageBottom,
                  ),
                  children: [
                    _PurchaseHero(stats: stats),
                    const SizedBox(height: AppSpacing.lg),
                    _FilterBar(
                      selected: _filter,
                      onChanged: (value) => setState(() => _filter = value),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    if (_visibleOrders.isEmpty)
                      AppCard(
                        padding: const EdgeInsets.symmetric(
                          vertical: AppSpacing.xxl,
                          horizontal: AppSpacing.lg,
                        ),
                        child: EmptyState(
                          icon: Icons.filter_list_off_outlined,
                          title: 'Không có mục phù hợp',
                          subtitle: _filter == null
                              ? 'Thử tải thêm hoặc kéo xuống làm mới.'
                              : 'Thử chọn bộ lọc khác.',
                        ),
                      )
                    else
                      ...sortedKeys.map((dayKey) {
                        final items = grouped[dayKey]!;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                          child: _DaySection(
                            label: dayGroupLabel(dayKey),
                            orders: items,
                          ),
                        );
                      }),
                    if (_hasMore)
                      Center(
                        child: _loading
                            ? const Padding(
                                padding: EdgeInsets.all(AppSpacing.lg),
                                child: CircularProgressIndicator(),
                              )
                            : OutlinedButton.icon(
                                onPressed: _load,
                                icon: const Icon(Icons.expand_more_rounded),
                                label: const Text('Tải thêm'),
                              ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _PurchaseHero extends StatelessWidget {
  const _PurchaseHero({required this.stats});

  final PurchaseHistoryStats stats;

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;
    final fmt = NumberFormat.decimalPattern('vi');

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
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.primary.withValues(alpha: 0.2),
                            AppColors.secondary.withValues(alpha: 0.2),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.25),
                        ),
                      ),
                      child: const Icon(
                        Icons.receipt_long_rounded,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${stats.total} giao dịch',
                            style: body.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            stats.xuSpent > 0
                                ? 'Đã dùng ${fmt.format(stats.xuSpent)} xu mua asset'
                                : 'Theo dõi gói, nạp xu và mua asset',
                            style: body.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _HeroStatChip(
                        icon: Icons.shopping_bag_outlined,
                        label: 'Asset',
                        value: '${stats.assets}',
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _HeroStatChip(
                        icon: Icons.workspace_premium_outlined,
                        label: 'Gói',
                        value: '${stats.subscriptions}',
                        color: AppColors.secondary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _HeroStatChip(
                        icon: Icons.monetization_on_outlined,
                        label: 'Nạp xu',
                        value: '${stats.creditPacks}',
                        color: AppColors.warning,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroStatChip extends StatelessWidget {
  const _HeroStatChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                  fontSize: 10,
                ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.selected, required this.onChanged});

  final String? selected;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(
            label: 'Tất cả',
            selected: selected == null,
            onTap: () => onChanged(null),
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Asset',
            icon: Icons.shopping_bag_outlined,
            color: AppColors.primary,
            selected: selected == 'asset',
            onTap: () => onChanged('asset'),
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Gói',
            icon: Icons.workspace_premium_outlined,
            color: AppColors.secondary,
            selected: selected == 'subscription',
            onTap: () => onChanged('subscription'),
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Nạp xu',
            icon: Icons.monetization_on_outlined,
            color: AppColors.warning,
            selected: selected == 'credit',
            onTap: () => onChanged('credit'),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
    this.color,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppColors.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: selected
                ? LinearGradient(
                    colors: [accent, accent.withValues(alpha: 0.75)],
                  )
                : null,
            color: selected ? null : AppColors.card.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected
                  ? accent.withValues(alpha: 0.5)
                  : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 14,
                  color: selected ? AppColors.primaryForeground : accent,
                ),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: selected
                          ? AppColors.primaryForeground
                          : AppColors.foreground,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DaySection extends StatelessWidget {
  const _DaySection({required this.label, required this.orders});

  final String label;
  final List<Order> orders;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Row(
            children: [
              Container(
                width: 3,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(width: 8),
              Text(
                '${orders.length}',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
              ),
            ],
          ),
        ),
        AppCard(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          child: Column(
            children: [
              for (var i = 0; i < orders.length; i++) ...[
                if (i > 0)
                  Divider(
                    height: 1,
                    color: AppColors.border.withValues(alpha: 0.65),
                  ),
                PurchaseOrderRow(order: orders[i]),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class PurchaseOrderRow extends StatelessWidget {
  const PurchaseOrderRow({
    super.key,
    required this.order,
    this.compact = false,
  });

  final Order order;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final typeColor = purchaseOrderColor(order.orderType);
    final amount = purchaseOrderAmountLabel(order);
    final amountColor = purchaseOrderAmountColor(order);
    final body = Theme.of(context).textTheme;
    final iconSize = compact ? 36.0 : 44.0;

    final content = Padding(
      padding: EdgeInsets.symmetric(
        vertical: compact ? 10 : 12,
        horizontal: compact ? 4 : 8,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: iconSize,
            height: iconSize,
            decoration: BoxDecoration(
              color: typeColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(compact ? 10 : 12),
              border: Border.all(color: typeColor.withValues(alpha: 0.28)),
            ),
            child: Icon(
              purchaseOrderIcon(order.orderType),
              size: compact ? 18 : 22,
              color: typeColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  purchaseOrderTitle(order),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: body.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    _TypeBadge(
                      label: purchaseOrderTypeLabel(order.orderType),
                      color: typeColor,
                    ),
                    if (order.orderCode.isNotEmpty)
                      Text(
                        order.orderCode,
                        style: body.labelSmall?.copyWith(
                          color: AppColors.mutedForeground,
                          fontFamily: 'monospace',
                          fontSize: 10,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      size: 12,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      compact
                          ? formatPurchaseTime(order.createdAt)
                          : formatPurchaseDateTime(order.createdAt),
                      style: body.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _AmountBadge(label: amount, color: amountColor),
        ],
      ),
    );

    if (compact) return content;

    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: typeColor.withValues(alpha: 0.55),
            width: 3,
          ),
        ),
      ),
      child: content,
    );
  }
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.28)),
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

class _AmountBadge extends StatelessWidget {
  const _AmountBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 11,
            ),
      ),
    );
  }
}
