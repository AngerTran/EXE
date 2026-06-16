import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
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
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
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
            const SizedBox(height: 20),
            _FeaturesSection(),
            const SizedBox(height: 20),
            _StepsSection(),
            const SizedBox(height: 24),
            SectionHeader(
              title: 'Asset nổi bật',
              subtitle: 'Gợi ý từ marketplace',
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
                  );
                }
                return SizedBox(
                  height: 220,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: result.items.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, i) {
                      final asset = result.items[i];
                      return SizedBox(
                        width: 180,
                        child: _FeaturedTile(
                          title: asset.title,
                          category: asset.categoryName,
                          thumbnailUrl: asset.thumbnailUrl,
                          isFree: asset.isFree,
                          onTap: () => context.push('/marketplace/${asset.id}'),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              ),
              error: (e, _) => EmptyState(
                icon: Icons.cloud_off_outlined,
                title: 'Không tải được asset',
                subtitle: e.toString(),
              ),
            ),
            const SizedBox(height: 24),
            SectionHeader(
              title: 'Bắt đầu nhanh',
              subtitle: 'Các bước phổ biến cho indie dev',
            ),
            _QuickAction(
              icon: Icons.auto_awesome,
              title: 'Hỏi AssetBox AI',
              subtitle: 'Phân tích ý tưởng game & gợi ý asset',
              color: AppColors.primary,
              onTap: () => context.go('/ai'),
            ),
            const SizedBox(height: 10),
            _QuickAction(
              icon: Icons.storefront_outlined,
              title: 'Duyệt Marketplace',
              subtitle: 'Tìm 2D, audio, tileset và hơn thế',
              color: AppColors.secondary,
              onTap: () => context.go('/marketplace'),
            ),
            const SizedBox(height: 10),
            _QuickAction(
              icon: Icons.workspace_premium_outlined,
              title: 'Xem gói dịch vụ',
              subtitle: 'Nâng cấp xu AI & tính năng',
              color: AppColors.warning,
              onTap: () => context.go('/pricing'),
            ),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.88),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withValues(alpha: 0.14),
            AppColors.secondary.withValues(alpha: 0.08),
            AppColors.card.withValues(alpha: 0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isLoggedIn ? 'Xin chào, ${userName ?? 'bạn'}!' : 'AssetBox',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Nền tảng assets & AI hỗ trợ game developer Việt Nam.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.mutedForeground,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 16),
          if (assetTotal != null)
            Row(
              children: [
                _StatPill(
                  value: assetTotal! >= 1000
                      ? '${(assetTotal! / 1000).toStringAsFixed(1)}k+'
                      : '${assetTotal!}+',
                  label: 'Assets',
                ),
                const SizedBox(width: 8),
                const _StatPill(value: '24/7', label: 'AI'),
              ],
            ),
          const SizedBox(height: 16),
          if (isLoggedIn)
            XuBadge(balance: credits, isUnlimited: isUnlimited)
          else
            GradientCtaButton(
              label: 'Đăng nhập / Đăng ký',
              icon: Icons.login,
              onPressed: () => context.push('/auth'),
            ),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              )),
          Text(label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.mutedForeground,
                  )),
        ],
      ),
    );
  }
}

class _FeaturesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.auto_awesome, 'AI phân tích', 'Gợi ý gameplay & asset'),
      (Icons.palette_outlined, 'Kho asset', '2D, audio, tileset'),
      (Icons.bolt, 'Đề xuất nhanh', 'Asset phù hợp trong giây'),
      (Icons.code, 'Dễ dùng', 'Thân thiện indie dev'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Tính năng'),
        ...items.map(
          (e) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.card.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Icon(e.$1, color: AppColors.primary, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ItemTitle(title: e.$2, subtitle: e.$3),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StepsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const steps = [
      'Mô tả ý tưởng game cho AI',
      'Nhận phân tích & gợi ý asset',
      'Chọn asset từ marketplace',
      'Tải về và bắt đầu làm game',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Bắt đầu trong 4 bước'),
        ...steps.asMap().entries.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.card.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor:
                            AppColors.secondary.withValues(alpha: 0.25),
                        child: Text(
                          '${e.key + 1}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.secondary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          e.value,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
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
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.82),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(15),
                  ),
                  child: thumbnailUrl != null
                      ? Image.network(
                          thumbnailUrl!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          errorBuilder: (_, __, ___) => _placeholder(),
                        )
                      : _placeholder(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Text(
                      category,
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

  Widget _placeholder() => Container(
        color: AppColors.border,
        child: const Center(
          child: Icon(Icons.image_outlined, color: AppColors.muted),
        ),
      );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.82),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
            ],
          ),
        ),
      ),
    );
  }
}
