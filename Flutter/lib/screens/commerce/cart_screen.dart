import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final cart = ref.watch(cartProvider);
    final fmt = NumberFormat.decimalPattern('vi');

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Giỏ hàng')),
        body: EmptyState(
          icon: Icons.shopping_cart_outlined,
          title: 'Giỏ hàng trống',
          subtitle: 'Đăng nhập để thêm asset vào giỏ.',
          action: GradientCtaButton(
            label: 'Đăng nhập',
            expand: false,
            onPressed: () => context.push('/auth'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Giỏ hàng')),
      body: cart.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => EmptyState(
          icon: Icons.error_outline,
          title: 'Không tải được giỏ',
          subtitle: e.toString(),
          action: GradientCtaButton(
            label: 'Thử lại',
            expand: false,
            onPressed: () => ref.read(cartProvider.notifier).refresh(),
          ),
        ),
        data: (data) {
          if (data.items.isEmpty) {
            return EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Giỏ hàng trống',
              subtitle: 'Duyệt marketplace để thêm asset.',
              action: GradientCtaButton(
                label: 'Đi tới Marketplace',
                expand: false,
                onPressed: () => context.go('/marketplace'),
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: data.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final item = data.items[i];
                    return Dismissible(
                      key: ValueKey(item.id),
                      direction: DismissDirection.endToStart,
                      onDismissed: (_) =>
                          ref.read(cartProvider.notifier).removeItem(item.id),
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        color: AppColors.destructive,
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(8),
                        tileColor: AppColors.card.withValues(alpha: 0.55),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: AppColors.border),
                        ),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SizedBox(
                            width: 48,
                            height: 48,
                            child: item.asset.thumbnailUrl != null
                                ? CachedNetworkImage(
                                    imageUrl: item.asset.thumbnailUrl!,
                                    fit: BoxFit.cover,
                                  )
                                : Container(color: AppColors.border),
                          ),
                        ),
                        title: Text(item.asset.title, maxLines: 2),
                        subtitle: Text(
                          item.asset.isFree
                              ? 'Miễn phí'
                              : '${fmt.format(item.asset.priceVnd)}đ',
                        ),
                        onTap: () =>
                            context.push('/marketplace/${item.assetId}'),
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.border)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính'),
                        Text(
                          '${fmt.format(data.subtotalVnd)}đ',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    GradientCtaButton(
                      label: 'Thanh toán',
                      icon: Icons.payment,
                      onPressed: () => context.push('/checkout/assets'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
