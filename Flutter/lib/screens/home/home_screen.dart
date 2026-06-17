import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../models/asset_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final featured = ref.watch(_featuredAssetsProvider);

    return SafeArea(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(_featuredAssetsProvider);
          await ref.read(_featuredAssetsProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.sm,
            AppSpacing.page,
            AppSpacing.pageBottom,
          ),
          children: [
            _HeroSection(
              isLoggedIn: auth.isLoggedIn,
              userName: auth.user?.name,
              credits: auth.user?.credits ?? 0,
              isUnlimited: auth.user?.isUnlimited ?? false,
              assetTotal: featured.maybeWhen(
                data: (r) => r.total,
                orElse: () => null,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _QuickActionsRow(
              isLoggedIn: auth.isLoggedIn,
              onAi: () => context.go('/ai'),
              onMarket: () => context.go('/marketplace'),
              onPricing: () => context.go('/pricing'),
              onAuth: () => context.push('/auth'),
            ),
            const SizedBox(height: AppSpacing.xxl),
            SectionHeader(
              title: 'Asset nổi bật',
              subtitle: 'Được tải nhiều nhất',
              trailing: TextButton(
                onPressed: () => context.go('/marketplace'),
                child: const Text('Xem tất cả'),
              ),
            ),
            featured.when(
              data: (result) {
                if (result.items.isEmpty) {
                  return const EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: 'Chưa có asset nổi bật',
                    subtitle: 'Khám phá marketplace để tìm tài nguyên mới.',
                  );
                }
                return SizedBox(
                  height: 228,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: result.items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: AppSpacing.md),
                    itemBuilder: (context, i) {
                      final asset = result.items[i];
                      return SizedBox(
                        width: 168,
                        child: _FeaturedTile(
                          title: asset.title,
                          category: asset.categoryName,
                          thumbnailUrl: asset.thumbnailUrl,
                          isFree: asset.isFree,
                          onTap: () =>
                              context.push('/marketplace/${asset.id}'),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const SizedBox(
                height: 228,
                child: LoadingView(message: 'Đang tải asset...'),
              ),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được asset',
                onRetry: () => ref.invalidate(_featuredAssetsProvider),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const _HowItWorksSection(),
          ],
        ),
      ),
    );
  }
}

typedef _FeaturedResult = ({List<AssetListItem> items, int total});

final _featuredAssetsProvider = FutureProvider<_FeaturedResult>((ref) async {
  final service = await ref.watch(assetServiceProvider.future);
  final res = await service.fetchAssets(featured: true, pageSize: 8);
  return (items: res.data, total: res.total);
});

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.isLoggedIn,
    this.userName,
    required this.credits,
    required this.isUnlimited,
    this.assetTotal,
  });

  final bool isLoggedIn;
  final String? userName;
  final int credits;
  final bool isUnlimited;
  final int? assetTotal;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isLoggedIn ? 'Xin chào, ${userName ?? 'bạn'}!' : 'Chào mừng đến AssetBox',
            style: Theme.of(context).primaryTextTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Tìm asset game, hỏi AI và quản lý thư viện — mọi thứ trên điện thoại.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.mutedForeground,
                  height: 1.45,
                ),
          ),
          if (assetTotal != null) ...[
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                _StatPill(
                  value: assetTotal! >= 1000
                      ? '${(assetTotal! / 1000).toStringAsFixed(1)}k+'
                      : '$assetTotal+',
                  label: 'Assets',
                ),
                const SizedBox(width: AppSpacing.sm),
                const _StatPill(value: '24/7', label: 'AI hỗ trợ'),
              ],
            ),
          ],
          if (isLoggedIn) ...[
            const SizedBox(height: AppSpacing.lg),
            XuBadge(balance: credits, isUnlimited: isUnlimited),
          ],
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: Theme.of(context).primaryTextTheme.titleSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionsRow extends StatelessWidget {
  const _QuickActionsRow({
    required this.isLoggedIn,
    required this.onAi,
    required this.onMarket,
    required this.onPricing,
    required this.onAuth,
  });

  final bool isLoggedIn;
  final VoidCallback onAi;
  final VoidCallback onMarket;
  final VoidCallback onPricing;
  final VoidCallback onAuth;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickChip(
            icon: Icons.auto_awesome,
            label: 'AI',
            color: AppColors.primary,
            onTap: onAi,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _QuickChip(
            icon: Icons.storefront_outlined,
            label: 'Chợ',
            color: AppColors.secondary,
            onTap: onMarket,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _QuickChip(
            icon: isLoggedIn
                ? Icons.folder_outlined
                : Icons.login_rounded,
            label: isLoggedIn ? 'Thư viện' : 'Đăng nhập',
            color: AppColors.warning,
            onTap: isLoggedIn ? () => context.go('/library') : onAuth,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _QuickChip(
            icon: Icons.workspace_premium_outlined,
            label: 'Gói',
            color: AppColors.success,
            onTap: onPricing,
          ),
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.88),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HowItWorksSection extends StatefulWidget {
  const _HowItWorksSection();

  @override
  State<_HowItWorksSection> createState() => _HowItWorksSectionState();
}

class _HowItWorksSectionState extends State<_HowItWorksSection> {
  var _expanded = false;

  @override
  Widget build(BuildContext context) {
    const steps = [
      (Icons.edit_note_outlined, 'Mô tả ý tưởng game cho AI'),
      (Icons.insights_outlined, 'Nhận phân tích & gợi ý asset'),
      (Icons.storefront_outlined, 'Chọn asset từ marketplace'),
      (Icons.download_rounded, 'Tải về và bắt đầu làm game'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: Ink(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: AppColors.card.withValues(alpha: 0.75),
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.help_outline_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      'AssetBox hoạt động thế nào?',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.foreground,
                          ),
                    ),
                  ),
                  Icon(
                    _expanded
                        ? Icons.expand_less_rounded
                        : Icons.expand_more_rounded,
                    color: AppColors.mutedForeground,
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_expanded) ...[
          const SizedBox(height: AppSpacing.sm),
          ...steps.asMap().entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: AppCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.md,
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor:
                              AppColors.secondary.withValues(alpha: 0.2),
                          child: Text(
                            '${e.key + 1}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.secondary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Icon(e.value.$1,
                            size: 18, color: AppColors.mutedForeground),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            e.value.$2,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.foreground,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        ],
      ],
    );
  }
}

class _FeaturedTile extends StatelessWidget {
  const _FeaturedTile({
    required this.title,
    required this.category,
    this.thumbnailUrl,
    required this.isFree,
    required this.onTap,
  });

  final String title;
  final String category;
  final String? thumbnailUrl;
  final bool isFree;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(AppRadius.lg - 1),
                      ),
                      child: _Thumbnail(url: thumbnailUrl),
                    ),
                    if (isFree)
                      Positioned(
                        top: AppSpacing.sm,
                        left: AppSpacing.sm,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Free',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.foreground,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      category,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) return _placeholder();
    return CachedNetworkImage(
      imageUrl: url!,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (_, __) => _placeholder(),
      errorWidget: (_, __, ___) => _placeholder(),
    );
  }

  Widget _placeholder() => Container(
        color: AppColors.border,
        child: const Center(
          child: Icon(Icons.image_outlined, color: AppColors.muted),
        ),
      );
}
