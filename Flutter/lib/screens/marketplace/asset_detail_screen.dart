import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/asset_models.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class AssetDetailScreen extends ConsumerStatefulWidget {
  const AssetDetailScreen({super.key, required this.assetId});

  final String assetId;

  @override
  ConsumerState<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends ConsumerState<AssetDetailScreen> {
  bool _busy = false;

  Future<void> _toggleBookmark(AssetDetail asset, bool isBookmarked) async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    setState(() => _busy = true);
    try {
      final svc = await ref.read(bookmarksServiceProvider.future);
      if (isBookmarked) {
        await svc.removeBookmark(asset.id);
      } else {
        await svc.addBookmark(asset.id);
      }
      ref.invalidate(bookmarkIdsProvider);
    } catch (e) {
      _snack(friendlyErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addToCart(AssetDetail asset) async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    if (asset.isFree) {
      _snack('Asset miễn phí — tải từ thư viện sau khi nhận', error: false);
      return;
    }
    setState(() => _busy = true);
    final err = await ref.read(cartProvider.notifier).addItem(asset.id);
    if (mounted) {
      setState(() => _busy = false);
      if (err == null) {
        _snack('Đã thêm vào giỏ hàng', error: false);
      } else {
        _snack(err, error: true);
      }
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: error ? AppColors.destructive : AppColors.card,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final assetAsync = ref.watch(_assetDetailProvider(widget.assetId));
    final bookmarks = ref.watch(bookmarkIdsProvider);
    final related = ref.watch(_relatedProvider(widget.assetId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết asset'),
        actions: [
          assetAsync.maybeWhen(
            data: (asset) {
              final isBookmarked = bookmarks.maybeWhen(
                data: (s) => s.contains(asset.id),
                orElse: () => false,
              );
              return IconButton(
                onPressed: _busy
                    ? null
                    : () => _toggleBookmark(asset, isBookmarked),
                icon: Icon(
                  isBookmarked
                      ? Icons.bookmark_rounded
                      : Icons.bookmark_border_rounded,
                  color: isBookmarked ? AppColors.warning : null,
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: assetAsync.when(
        data: (asset) {
          final fmt = NumberFormat.decimalPattern('vi');

          return ListView(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.page,
              AppSpacing.sm,
              AppSpacing.page,
              100,
            ),
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.lg),
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 10,
                      child: asset.thumbnailUrl != null
                          ? CachedNetworkImage(
                              imageUrl: asset.thumbnailUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, _) => Container(
                                color: AppColors.border,
                              ),
                            )
                          : Container(
                              color: AppColors.border,
                              child: const Icon(
                                Icons.image_outlined,
                                size: 48,
                                color: AppColors.muted,
                              ),
                            ),
                    ),
                    if (asset.isFree)
                      Positioned(
                        top: AppSpacing.md,
                        left: AppSpacing.md,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'MIỄN PHÍ',
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
              const SizedBox(height: AppSpacing.lg),
              Text(
                asset.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.foreground,
                    ),
              ),
              if (asset.shortDescription != null &&
                  asset.shortDescription!.trim().isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  asset.shortDescription!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.mutedForeground,
                        height: 1.45,
                      ),
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  _MetaChip(
                    icon: Icons.person_outline_rounded,
                    label: asset.uploaderName.isNotEmpty
                        ? asset.uploaderName
                        : 'AssetBox',
                  ),
                  if (asset.artStyle != null && asset.artStyle!.isNotEmpty)
                    _MetaChip(
                      icon: Icons.palette_outlined,
                      label: asset.artStyle!,
                    ),
                  _MetaChip(
                    icon: Icons.verified_outlined,
                    label: asset.license.isNotEmpty ? asset.license : 'Standard',
                  ),
                  _MetaChip(
                    icon: Icons.category_outlined,
                    label: asset.categoryName,
                  ),
                  _MetaChip(
                    icon: Icons.star_rounded,
                    label:
                        '${asset.ratingAvg.toStringAsFixed(1)} (${asset.ratingCount})',
                  ),
                  _MetaChip(
                    icon: Icons.download_outlined,
                    label: '${asset.downloadCount} lượt tải',
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              AppCard(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Giá',
                            style: Theme.of(context)
                                .textTheme
                                .labelMedium
                                ?.copyWith(color: AppColors.mutedForeground),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            asset.isFree
                                ? 'Miễn phí'
                                : '${fmt.format(asset.displayPrice)} xu',
                            style: Theme.of(context)
                                .primaryTextTheme
                                .titleLarge
                                ?.copyWith(
                                  color: asset.isFree
                                      ? AppColors.success
                                      : AppColors.warning,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ],
                      ),
                    ),
                    if (!asset.isFree)
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: const Icon(
                          Icons.monetization_on_outlined,
                          color: AppColors.warning,
                        ),
                      ),
                  ],
                ),
              ),
              if (asset.fullDescription != null &&
                  asset.fullDescription!.trim().isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xl),
                const SectionHeader(title: 'Mô tả', compact: true),
                Text(
                  asset.fullDescription!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        height: 1.55,
                        color: AppColors.mutedForeground,
                      ),
                ),
              ],
              if (asset.tags.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xl),
                const SectionHeader(title: 'Tags', compact: true),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: asset.tags.map((t) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.secondary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: AppColors.secondary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        t,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppColors.secondary,
                            ),
                      ),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: AppSpacing.xl),
              _ReviewsSection(assetId: asset.id),
              related.when(
                data: (items) {
                  if (items.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionHeader(
                        title: 'Asset liên quan',
                        compact: true,
                      ),
                      SizedBox(
                        height: 160,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: items.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(width: AppSpacing.md),
                          itemBuilder: (context, i) {
                            final a = items[i];
                            return _RelatedTile(
                              title: a.title,
                              thumbnailUrl: a.thumbnailUrl,
                              onTap: () => context.pushReplacement(
                                '/marketplace/${a.id}',
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
              ),
            ],
          );
        },
        loading: () => const LoadingView(message: 'Đang tải asset...'),
        error: (e, _) => ErrorState(
          error: e,
          title: 'Không tải được asset',
          onRetry: () => ref.invalidate(_assetDetailProvider(widget.assetId)),
        ),
      ),
      bottomNavigationBar: assetAsync.maybeWhen(
        data: (asset) => _StickyActionBar(
          busy: _busy,
          asset: asset,
          onPrimary: () => asset.isFree
              ? _snack(
                  'Tải miễn phí qua đơn asset — dùng web hoặc thư viện sau khi nhận.',
                  error: false,
                )
              : _addToCart(asset),
        ),
        orElse: () => null,
      ),
    );
  }
}

class _StickyActionBar extends StatelessWidget {
  const _StickyActionBar({
    required this.busy,
    required this.asset,
    required this.onPrimary,
  });

  final bool busy;
  final AssetDetail asset;
  final VoidCallback onPrimary;

  @override
  Widget build(BuildContext context) {
    return Material(
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
              AppSpacing.md,
              AppSpacing.page,
              AppSpacing.md,
            ),
            child: GradientCtaButton(
              label: asset.isFree ? 'Nhận miễn phí' : 'Thêm vào giỏ',
              icon: asset.isFree
                  ? Icons.download_rounded
                  : Icons.add_shopping_cart_rounded,
              loading: busy,
              onPressed: busy ? null : onPrimary,
            ),
          ),
        ),
      ),
    );
  }
}

class _RelatedTile extends StatelessWidget {
  const _RelatedTile({
    required this.title,
    this.thumbnailUrl,
    required this.onTap,
  });

  final String title;
  final String? thumbnailUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          width: 130,
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppRadius.md - 1),
                  ),
                  child: thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: thumbnailUrl!,
                          width: 130,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: AppColors.border,
                          child: const Icon(Icons.image_outlined),
                        ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewsSection extends ConsumerStatefulWidget {
  const _ReviewsSection({required this.assetId});

  final String assetId;

  @override
  ConsumerState<_ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends ConsumerState<_ReviewsSection> {
  final _comment = TextEditingController();
  int _rating = 5;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    try {
      final svc = await ref.read(reviewsServiceProvider.future);
      await svc.createReview(
        widget.assetId,
        _rating,
        comment: _comment.text,
      );
      _comment.clear();
      ref.invalidate(_reviewsProvider(widget.assetId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi đánh giá')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyErrorMessage(e)),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reviews = ref.watch(_reviewsProvider(widget.assetId));

    return reviews.when(
      data: (items) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Đánh giá',
            subtitle: items.isEmpty ? 'Chưa có đánh giá' : '${items.length} đánh giá',
            compact: true,
          ),
          ...items.take(5).map(
                (r) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: AppCard(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor:
                              AppColors.primary.withValues(alpha: 0.15),
                          child: Text(
                            r.userName.isNotEmpty
                                ? r.userName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      r.userName,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  ...List.generate(
                                    5,
                                    (i) => Icon(
                                      i < r.rating
                                          ? Icons.star_rounded
                                          : Icons.star_border_rounded,
                                      size: 14,
                                      color: AppColors.warning,
                                    ),
                                  ),
                                ],
                              ),
                              if (r.comment != null &&
                                  r.comment!.trim().isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  r.comment!,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: AppColors.mutedForeground,
                                        height: 1.4,
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          if (ref.watch(authProvider).isLoggedIn) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Viết đánh giá của bạn',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: List.generate(
                      5,
                      (i) => IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: Icon(
                          i < _rating
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: AppColors.warning,
                          size: 28,
                        ),
                        onPressed: () => setState(() => _rating = i + 1),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  TextField(
                    controller: _comment,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Chia sẻ trải nghiệm với asset này...',
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  GradientCtaButton(
                    label: 'Gửi đánh giá',
                    expand: false,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: LinearProgressIndicator(color: AppColors.primary),
      ),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

final _assetDetailProvider =
    FutureProvider.family<AssetDetail, String>((ref, id) async {
  final service = await ref.watch(assetServiceProvider.future);
  return service.fetchAssetById(id);
});

final _relatedProvider =
    FutureProvider.family<List<AssetListItem>, String>((ref, id) async {
  final service = await ref.watch(assetServiceProvider.future);
  final asset = await service.fetchAssetById(id);
  final res = await service.fetchAssets(
    categoryId: asset.categoryId,
    pageSize: 6,
  );
  return res.data.where((a) => a.id != id).take(5).toList();
});

final _reviewsProvider =
    FutureProvider.family<List<ReviewItem>, String>((ref, assetId) async {
  final svc = await ref.watch(reviewsServiceProvider.future);
  return svc.fetchAssetReviews(assetId);
});

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.mutedForeground),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}
