import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

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
            _HomeHero(
              isLoggedIn: auth.isLoggedIn,
              userName: auth.user?.name,
              assetTotal: featured.maybeWhen(
                data: (r) => r.total,
                orElse: () => null,
              ),
              onAi: () => context.go('/ai'),
              onMarket: () => context.go('/marketplace'),
              onAuth: () => context.push('/auth'),
            ),
            const SizedBox(height: AppSpacing.xl),
            _QuickActionsGrid(
              isLoggedIn: auth.isLoggedIn,
              onAi: () => context.go('/ai'),
              onMarket: () => context.go('/marketplace'),
              onLibrary: () => context.go('/library'),
              onPricing: () => context.go('/pricing'),
              onAuth: () => context.push('/auth'),
            ),
            const SizedBox(height: AppSpacing.xxl),
            SectionHeader(
              title: 'Asset nổi bật',
              subtitle: 'Được tải nhiều nhất trên marketplace',
              trailing: TextButton(
                onPressed: () => context.go('/marketplace'),
                child: const Text('Xem tất cả'),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
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
                  height: 248,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    itemCount: result.items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: AppSpacing.md),
                    itemBuilder: (context, i) {
                      final asset = result.items[i];
                      return SizedBox(
                        width: 176,
                        child: _FeaturedTile(
                          asset: asset,
                          accent: _featuredAccents[i % _featuredAccents.length],
                          onTap: () =>
                              context.push('/marketplace/${asset.id}'),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const SizedBox(
                height: 248,
                child: LoadingView(message: 'Đang tải asset...'),
              ),
              error: (e, _) => ErrorState(
                error: e,
                title: 'Không tải được asset',
                onRetry: () => ref.invalidate(_featuredAssetsProvider),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const SectionHeader(
              title: 'Tại sao chọn AssetBox?',
              subtitle: 'Công cụ cho người mới làm game',
              compact: true,
            ),
            const SizedBox(height: AppSpacing.md),
            const _FeatureGrid(),
            const SizedBox(height: AppSpacing.xxl),
            const _HowItWorksSection(),
          ],
        ),
      ),
    );
  }
}

const _featuredAccents = [
  AppColors.primary,
  AppColors.secondary,
  AppColors.warning,
  AppColors.success,
];

typedef _FeaturedResult = ({List<AssetListItem> items, int total});

final _featuredAssetsProvider = FutureProvider<_FeaturedResult>((ref) async {
  final service = await ref.watch(assetServiceProvider.future);
  final res = await service.fetchAssets(featured: true, pageSize: 8);
  return (items: res.data, total: res.total);
});

class _HomeHero extends StatelessWidget {
  const _HomeHero({
    required this.isLoggedIn,
    this.userName,
    this.assetTotal,
    required this.onAi,
    required this.onMarket,
    required this.onAuth,
  });

  final bool isLoggedIn;
  final String? userName;
  final int? assetTotal;
  final VoidCallback onAi;
  final VoidCallback onMarket;
  final VoidCallback onAuth;

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          top: -24,
          right: -20,
          child: _GlowOrb(
            color: AppColors.primary.withValues(alpha: 0.18),
            size: 140,
          ),
        ),
        Positioned(
          bottom: -16,
          left: -24,
          child: _GlowOrb(
            color: AppColors.secondary.withValues(alpha: 0.14),
            size: 120,
          ),
        ),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.22),
            ),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.card.withValues(alpha: 0.95),
                AppColors.card.withValues(alpha: 0.82),
                AppColors.primary.withValues(alpha: 0.06),
              ],
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.xl - 1),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _AiBadge(),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      isLoggedIn
                          ? 'Xin chào, ${userName ?? 'bạn'}!'
                          : 'Tìm asset cho game',
                      style: body.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.foreground,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    ShaderMask(
                      blendMode: BlendMode.srcIn,
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [
                          AppColors.primary,
                          AppColors.secondary,
                          AppColors.primary,
                        ],
                      ).createShader(bounds),
                      child: Text(
                        isLoggedIn ? 'Sáng tạo hôm nay' : 'Dễ dàng hơn',
                        style: body.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'AI phân tích ý tưởng, gợi ý asset phù hợp và quản lý thư viện ngay trên điện thoại.',
                      style: body.bodyMedium?.copyWith(
                        color: AppColors.mutedForeground,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Row(
                      children: [
                        Expanded(
                          child: GradientCtaButton(
                            label: isLoggedIn ? 'Hỏi AI' : 'Bắt đầu',
                            icon: Icons.auto_awesome_rounded,
                            expand: true,
                            onPressed: isLoggedIn ? onAi : onAuth,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: _OutlineCta(
                            label: 'Khám phá',
                            icon: Icons.storefront_outlined,
                            onPressed: onMarket,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _StatsStrip(assetTotal: assetTotal),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class _AiBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, size: 14, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            'Powered by AI',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}

class _OutlineCta extends StatelessWidget {
  const _OutlineCta({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.background.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: AppColors.foreground),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.foreground,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatsStrip extends StatelessWidget {
  const _StatsStrip({this.assetTotal});

  final int? assetTotal;

  String _formatTotal(int n) {
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(1).replaceAll('.0', '')}k+';
    }
    return '$n+';
  }

  @override
  Widget build(BuildContext context) {
    final stats = [
      (assetTotal != null ? _formatTotal(assetTotal!) : '1000+', 'Assets'),
      ('24/7', 'AI hỗ trợ'),
      ('Free', 'Asset miễn phí'),
      ('2D·3D', 'Đa thể loại'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.8)),
      ),
      child: Row(
        children: stats.map((s) {
          return Expanded(
            child: Column(
              children: [
                Text(
                  s.$1,
                  style: Theme.of(context).primaryTextTheme.titleSmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  s.$2,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 10,
                      ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.isLoggedIn,
    required this.onAi,
    required this.onMarket,
    required this.onLibrary,
    required this.onPricing,
    required this.onAuth,
  });

  final bool isLoggedIn;
  final VoidCallback onAi;
  final VoidCallback onMarket;
  final VoidCallback onLibrary;
  final VoidCallback onPricing;
  final VoidCallback onAuth;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.auto_awesome_rounded,
                label: 'AssetBox AI',
                subtitle: 'Phân tích & gợi ý',
                color: AppColors.primary,
                large: true,
                onTap: onAi,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.storefront_rounded,
                label: 'Chợ Assets',
                subtitle: 'Mua & tải về',
                color: AppColors.secondary,
                large: true,
                onTap: onMarket,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: isLoggedIn
                    ? Icons.folder_special_outlined
                    : Icons.login_rounded,
                label: isLoggedIn ? 'Thư viện' : 'Đăng nhập',
                subtitle: isLoggedIn ? 'Asset của bạn' : 'Lưu & mua asset',
                color: AppColors.warning,
                onTap: isLoggedIn ? onLibrary : onAuth,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.workspace_premium_outlined,
                label: 'Gói dịch vụ',
                subtitle: 'Xu & gói Pro',
                color: AppColors.success,
                onTap: onPricing,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
    this.large = false,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          padding: EdgeInsets.all(large ? AppSpacing.lg : AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: large ? 44 : 36,
                height: large ? 44 : 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Icon(icon, color: color, size: large ? 22 : 18),
              ),
              SizedBox(height: large ? AppSpacing.md : AppSpacing.sm),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.foreground,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureGrid extends StatelessWidget {
  const _FeatureGrid();

  static const _items = [
    (
      Icons.psychology_outlined,
      'AI thông minh',
      'Phân tích gameplay & art style',
      AppColors.primary,
    ),
    (
      Icons.palette_outlined,
      'Kho asset phong phú',
      '2D, 3D, UI, âm thanh',
      AppColors.secondary,
    ),
    (
      Icons.bolt_outlined,
      'Gợi ý tức thì',
      'Asset phù hợp trong vài giây',
      AppColors.warning,
    ),
    (
      Icons.touch_app_outlined,
      'Dễ sử dụng',
      'Thân thiện cho người mới',
      AppColors.success,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.sm,
      crossAxisSpacing: AppSpacing.sm,
      childAspectRatio: 1.55,
      children: _items.map((item) {
        return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(item.$1, color: item.$4, size: 22),
              const Spacer(),
              Text(
                item.$2,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.foreground,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                item.$3,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.mutedForeground,
                      height: 1.35,
                    ),
              ),
            ],
          ),
        );
      }).toList(),
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

  static const _steps = [
    ('01', 'Mô tả ý tưởng', 'Chia sẻ thể loại, gameplay và phong cách đồ họa'),
    ('02', 'Nhận phân tích', 'AI góp ý mechanics, art style và hướng phát triển'),
    ('03', 'Chọn asset', 'Duyệt gợi ý AI hoặc tìm trên marketplace'),
    ('04', 'Bắt đầu tạo', 'Tải asset và xây dựng game của bạn'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: Ink(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.card.withValues(alpha: 0.95),
                    AppColors.secondary.withValues(alpha: 0.06),
                  ],
                ),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: const Icon(
                      Icons.route_outlined,
                      color: AppColors.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Quy trình 4 bước',
                          style:
                              Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.foreground,
                                  ),
                        ),
                        Text(
                          'AssetBox hoạt động thế nào?',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppColors.mutedForeground,
                              ),
                        ),
                      ],
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
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Padding(
            padding: const EdgeInsets.only(top: AppSpacing.md),
            child: Column(
              children: _steps.asMap().entries.map((e) {
                final isLast = e.key == _steps.length - 1;
                return _StepTile(
                  number: e.value.$1,
                  title: e.value.$2,
                  description: e.value.$3,
                  showLine: !isLast,
                );
              }).toList(),
            ),
          ),
          crossFadeState: _expanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 220),
        ),
      ],
    );
  }
}

class _StepTile extends StatelessWidget {
  const _StepTile({
    required this.number,
    required this.title,
    required this.description,
    required this.showLine,
  });

  final String number;
  final String title;
  final String description;
  final bool showLine;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.secondary],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  number,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.primaryForeground,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              if (showLine)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: AppColors.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: showLine ? AppSpacing.lg : 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.foreground,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                          height: 1.45,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedTile extends StatelessWidget {
  const _FeaturedTile({
    required this.asset,
    required this.accent,
    required this.onTap,
  });

  final AssetListItem asset;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: accent.withValues(alpha: 0.35)),
            boxShadow: [
              BoxShadow(
                color: accent.withValues(alpha: 0.12),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.lg - 1),
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: 3 / 4,
                  child: _Thumbnail(url: asset.thumbnailUrl),
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.background.withValues(alpha: 0.15),
                          AppColors.background.withValues(alpha: 0.92),
                        ],
                        stops: const [0.35, 0.65, 1.0],
                      ),
                    ),
                  ),
                ),
                if (asset.isFree)
                  Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.92),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Miễn phí',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 10,
                            ),
                      ),
                    ),
                  ),
                Positioned(
                  top: AppSpacing.sm,
                  right: AppSpacing.sm,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.background.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.download_rounded,
                          size: 11,
                          color: AppColors.mutedForeground,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          fmt.format(asset.downloadCount),
                          style:
                              Theme.of(context).textTheme.labelSmall?.copyWith(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: AppSpacing.md,
                  right: AppSpacing.md,
                  bottom: AppSpacing.md,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        asset.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.foreground,
                              height: 1.25,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: accent,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              asset.categoryName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(color: AppColors.mutedForeground),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
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
          child: Icon(Icons.image_outlined, color: AppColors.muted, size: 36),
        ),
      );
}
