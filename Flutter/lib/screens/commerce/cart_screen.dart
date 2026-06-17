import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
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
        body: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: AppCard(
            child: EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Giỏ hàng',
              subtitle: 'Đăng nhập để thêm asset và thanh toán.',
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
      appBar: AppBar(
        title: const Text('Giỏ hàng'),
        actions: [
          cart.maybeWhen(
            data: (data) => data.items.isEmpty
                ? const SizedBox.shrink()
                : Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.md),
                    child: Center(
                      child: Text(
                        '${data.itemCount} món',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                    ),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: cart.when(
        loading: () => const LoadingView(message: 'Đang tải giỏ hàng...'),
        error: (e, _) => ErrorState(
          error: e,
          title: 'Không tải được giỏ',
          onRetry: () => ref.read(cartProvider.notifier).refresh(),
        ),
        data: (data) {
          if (data.items.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              child: AppCard(
                child: EmptyState(
                  icon: Icons.shopping_cart_outlined,
                  title: 'Giỏ hàng trống',
                  subtitle: 'Duyệt marketplace để thêm asset vào giỏ.',
                  action: GradientCtaButton(
                    label: 'Đi tới Marketplace',
                    icon: Icons.storefront_outlined,
                    expand: false,
                    onPressed: () => context.go('/marketplace'),
                  ),
                ),
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.page),
                  itemCount: data.items.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: AppSpacing.md),
                  itemBuilder: (context, i) {
                    final item = data.items[i];
                    return Dismissible(
                      key: ValueKey(item.id),
                      direction: DismissDirection.endToStart,
                      onDismissed: (_) =>
                          ref.read(cartProvider.notifier).removeItem(item.id),
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: AppColors.destructive,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: const Icon(Icons.delete_outline_rounded,
                            color: Colors.white),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () =>
                              context.push('/marketplace/${item.assetId}'),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          child: Ink(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.card.withValues(alpha: 0.92),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.md),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.sm),
                                  child: SizedBox(
                                    width: 56,
                                    height: 56,
                                    child: item.asset.thumbnailUrl != null
                                        ? CachedNetworkImage(
                                            imageUrl:
                                                item.asset.thumbnailUrl!,
                                            fit: BoxFit.cover,
                                          )
                                        : Container(
                                            color: AppColors.border,
                                            child: const Icon(
                                              Icons.image_outlined,
                                              color: AppColors.muted,
                                            ),
                                          ),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.asset.title,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.asset.categoryName,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              color: AppColors.mutedForeground,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      item.asset.isFree
                                          ? 'Miễn phí'
                                          : '${fmt.format(item.lineTotalVnd)}đ',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelLarge
                                          ?.copyWith(
                                            color: item.asset.isFree
                                                ? AppColors.success
                                                : AppColors.primary,
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right_rounded,
                                      color: AppColors.mutedForeground,
                                      size: 20,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Material(
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
                        AppSpacing.lg,
                        AppSpacing.page,
                        AppSpacing.lg,
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Tạm tính',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(
                                        color: AppColors.mutedForeground,
                                      ),
                                ),
                              ),
                              Text(
                                '${fmt.format(data.subtotalVnd)}đ',
                                style: Theme.of(context)
                                    .primaryTextTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            'Vuốt sang trái để xóa món khỏi giỏ',
                            style:
                                Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: AppColors.muted,
                                    ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          GradientCtaButton(
                            label: 'Thanh toán (${data.itemCount})',
                            icon: Icons.payment_rounded,
                            onPressed: () => context.push('/checkout/assets'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
