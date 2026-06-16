import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class MyAssetsScreen extends ConsumerWidget {
  const MyAssetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final assets = ref.watch(userAssetsListProvider);

    if (!auth.isLoggedIn) {
      return SafeArea(
        child: EmptyState(
          icon: Icons.library_books_outlined,
          title: 'Thư viện asset của bạn',
          subtitle: 'Đăng nhập để xem asset đã mua hoặc tải miễn phí.',
          action: GradientCtaButton(
            label: 'Đăng nhập',
            expand: false,
            onPressed: () => context.push('/auth'),
          ),
        ),
      );
    }

    return SafeArea(
      child: assets.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              icon: Icons.inventory_2_outlined,
              title: 'Chưa có asset nào',
              subtitle: 'Khám phá marketplace để tìm tài nguyên cho game.',
              action: GradientCtaButton(
                label: 'Đi tới Marketplace',
                expand: false,
                onPressed: () => context.go('/marketplace'),
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async {
              ref.invalidate(userAssetsListProvider);
              await ref.read(userAssetsListProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final item = items[i];
                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => context.push('/library/${item.assetId}'),
                    borderRadius: BorderRadius.circular(14),
                    child: Ink(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.card.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: SizedBox(
                              width: 56,
                              height: 56,
                              child: item.thumbnailUrl != null
                                  ? CachedNetworkImage(
                                      imageUrl: item.thumbnailUrl!,
                                      fit: BoxFit.cover,
                                    )
                                  : Container(color: AppColors.border),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.categoryName,
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Icon(
                                Icons.download_done,
                                size: 18,
                                color: AppColors.success,
                              ),
                              Text(
                                '${item.downloadCount}x',
                                style: Theme.of(context).textTheme.labelSmall,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => EmptyState(
          icon: Icons.cloud_off_outlined,
          title: 'Không tải được thư viện',
          subtitle: e.toString(),
        ),
      ),
    );
  }
}
