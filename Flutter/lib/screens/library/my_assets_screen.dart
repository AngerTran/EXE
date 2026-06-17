import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
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
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: AppCard(
            child: EmptyState(
              icon: Icons.folder_outlined,
              title: 'Thư viện asset',
              subtitle:
                  'Đăng nhập để xem asset đã mua hoặc tải miễn phí.',
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

    return SafeArea(
      child: assets.when(
        data: (items) {
          if (items.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              child: AppCard(
                child: EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'Chưa có asset nào',
                  subtitle:
                      'Khám phá marketplace để tìm tài nguyên cho game.',
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

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async {
              ref.invalidate(userAssetsListProvider);
              await ref.read(userAssetsListProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.page,
                AppSpacing.sm,
                AppSpacing.page,
                AppSpacing.pageBottom,
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                  child: Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          label: 'Tổng asset',
                          value: '${items.length}',
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: _StatCard(
                          label: 'Lượt tải',
                          value: '${items.fold<int>(0, (s, i) => s + i.downloadCount)}',
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                ),
                SectionHeader(
                  title: 'Asset của bạn',
                  subtitle: '${items.length} asset trong thư viện',
                  compact: true,
                ),
                ...items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => context.push('/library/${item.assetId}'),
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
                                  width: 60,
                                  height: 60,
                                  child: item.thumbnailUrl != null
                                      ? CachedNetworkImage(
                                          imageUrl: item.thumbnailUrl!,
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.title,
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
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.success
                                      .withValues(alpha: 0.12),
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.sm),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.download_done_rounded,
                                      size: 14,
                                      color: AppColors.success,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${item.downloadCount}x',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: AppColors.success,
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.chevron_right_rounded,
                                color: AppColors.mutedForeground,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'Đang tải thư viện...'),
        error: (e, _) => ErrorState(
          error: e,
          title: 'Không tải được thư viện',
          onRetry: () => ref.invalidate(userAssetsListProvider),
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
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).primaryTextTheme.titleLarge?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
