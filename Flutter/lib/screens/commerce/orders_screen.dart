import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
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
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final auth = ref.watch(authProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Đơn hàng')),
        body: EmptyState(
          icon: Icons.receipt_long_outlined,
          title: 'Lịch sử đơn hàng',
          subtitle: 'Đăng nhập để xem đơn của bạn.',
          action: GradientCtaButton(
            label: 'Đăng nhập',
            expand: false,
            onPressed: () => context.push('/auth'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Đơn hàng')),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await _load(reset: true);
          await _loadSummary();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_summary != null)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.card.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _Stat(
                        label: 'Tổng đơn',
                        value: '${_summary!.totalOrders}',
                      ),
                    ),
                    Expanded(
                      child: _Stat(
                        label: 'Đã hoàn tất',
                        value: '${_summary!.completedOrders}',
                      ),
                    ),
                    Expanded(
                      child: _Stat(
                        label: 'Chờ xử lý',
                        value: '${_summary!.pendingOrders}',
                      ),
                    ),
                  ],
                ),
              ),
            if (_orders.isEmpty && _loading)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_orders.isEmpty)
              const EmptyState(
                icon: Icons.receipt_long_outlined,
                title: 'Chưa có đơn hàng',
              )
            else
              ..._orders.map((o) => Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    color: AppColors.card.withValues(alpha: 0.55),
                    child: ListTile(
                      title: Text(o.orderCode),
                      subtitle: Text(
                        '${o.orderType} · ${o.status}\n${_formatDate(o.createdAt)}',
                      ),
                      isThreeLine: true,
                      trailing: Text(
                        '${fmt.format(o.totalVnd)}đ',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  )),
            if (_hasMore && _orders.isNotEmpty)
              TextButton(
                onPressed: _loading ? null : () => _load(),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Tải thêm'),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                )),
        Text(label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                )),
      ],
    );
  }
}
