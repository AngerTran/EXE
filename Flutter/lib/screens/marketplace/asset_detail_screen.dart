import 'package:cached_network_image/cached_network_image.dart';

import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:intl/intl.dart';



import '../../core/theme/app_colors.dart';

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

      _snack(e.toString());

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

      _snack('Asset miễn phí — tải từ thư viện sau khi nhận');

      return;

    }

    setState(() => _busy = true);

    final err = await ref.read(cartProvider.notifier).addItem(asset.id);

    if (mounted) {

      setState(() => _busy = false);

      if (err == null) {

        _snack('Đã thêm vào giỏ hàng');

      } else {

        _snack(err);

      }

    }

  }



  void _snack(String msg) {

    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  }



  @override

  Widget build(BuildContext context) {

    final assetAsync = ref.watch(_assetDetailProvider(widget.assetId));

    final bookmarks = ref.watch(bookmarkIdsProvider);

    final related = ref.watch(_relatedProvider(widget.assetId));



    return Scaffold(

      appBar: AppBar(title: const Text('Chi tiết asset')),

      body: assetAsync.when(

        data: (asset) {

          final fmt = NumberFormat.decimalPattern('vi');

          final isBookmarked =

              bookmarks.maybeWhen(data: (s) => s.contains(asset.id), orElse: () => false);



          return ListView(

            padding: const EdgeInsets.all(16),

            children: [

              ClipRRect(

                borderRadius: BorderRadius.circular(16),

                child: AspectRatio(

                  aspectRatio: 16 / 10,

                  child: asset.thumbnailUrl != null

                      ? CachedNetworkImage(

                          imageUrl: asset.thumbnailUrl!,

                          fit: BoxFit.cover,

                        )

                      : Container(

                          color: AppColors.border,

                          child: const Icon(Icons.image_outlined, size: 48),

                        ),

                ),

              ),

              const SizedBox(height: 16),

              Row(

                children: [

                  Expanded(

                    child: Text(

                      asset.title,

                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(

                            fontWeight: FontWeight.w700,

                          ),

                    ),

                  ),

                  IconButton(

                    onPressed: _busy

                        ? null

                        : () => _toggleBookmark(asset, isBookmarked),

                    icon: Icon(

                      isBookmarked ? Icons.bookmark : Icons.bookmark_border,

                      color: isBookmarked ? AppColors.warning : null,

                    ),

                  ),

                ],

              ),

              Wrap(

                spacing: 8,

                runSpacing: 8,

                children: [

                  _MetaChip(

                    icon: Icons.category_outlined,

                    label: asset.categoryName,

                  ),

                  _MetaChip(

                    icon: Icons.star_outline,

                    label:

                        '${asset.ratingAvg.toStringAsFixed(1)} (${asset.ratingCount})',

                  ),

                  _MetaChip(

                    icon: Icons.download_outlined,

                    label: '${asset.downloadCount} lượt tải',

                  ),

                ],

              ),

              const SizedBox(height: 16),

              Container(

                width: double.infinity,

                padding: const EdgeInsets.all(16),

                decoration: BoxDecoration(

                  color: AppColors.card.withValues(alpha: 0.55),

                  borderRadius: BorderRadius.circular(14),

                  border: Border.all(color: AppColors.border),

                ),

                child: Text(

                  asset.isFree

                      ? 'Miễn phí'

                      : '${fmt.format(asset.displayPrice)} xu',

                  style: Theme.of(context).textTheme.titleLarge?.copyWith(

                        color: asset.isFree

                            ? AppColors.success

                            : AppColors.primary,

                        fontWeight: FontWeight.w700,

                      ),

                ),

              ),

              if (asset.fullDescription != null &&

                  asset.fullDescription!.trim().isNotEmpty) ...[

                const SizedBox(height: 16),

                const SectionHeader(title: 'Mô tả'),

                Text(

                  asset.fullDescription!,

                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(

                        height: 1.5,

                        color: AppColors.mutedForeground,

                      ),

                ),

              ],

              if (asset.tags.isNotEmpty) ...[

                const SizedBox(height: 16),

                const SectionHeader(title: 'Tags'),

                Wrap(

                  spacing: 8,

                  children: asset.tags

                      .map((t) => Chip(label: Text(t)))

                      .toList(),

                ),

              ],

              const SizedBox(height: 16),

              _ReviewsSection(assetId: asset.id),

              related.when(

                data: (items) {

                  if (items.isEmpty) return const SizedBox.shrink();

                  return Column(

                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [

                      const SectionHeader(title: 'Asset liên quan'),

                      SizedBox(

                        height: 140,

                        child: ListView.separated(

                          scrollDirection: Axis.horizontal,

                          itemCount: items.length,

                          separatorBuilder: (_, __) => const SizedBox(width: 10),

                          itemBuilder: (context, i) {

                            final a = items[i];

                            return GestureDetector(

                              onTap: () =>

                                  context.pushReplacement('/marketplace/${a.id}'),

                              child: SizedBox(

                                width: 120,

                                child: Column(

                                  crossAxisAlignment: CrossAxisAlignment.start,

                                  children: [

                                    Expanded(

                                      child: ClipRRect(

                                        borderRadius: BorderRadius.circular(10),

                                        child: a.thumbnailUrl != null

                                            ? CachedNetworkImage(

                                                imageUrl: a.thumbnailUrl!,

                                                width: 120,

                                                fit: BoxFit.cover,

                                              )

                                            : Container(color: AppColors.border),

                                      ),

                                    ),

                                    Text(a.title, maxLines: 1, overflow: TextOverflow.ellipsis),

                                  ],

                                ),

                              ),

                            );

                          },

                        ),

                      ),

                    ],

                  );

                },

                loading: () => const SizedBox.shrink(),

                error: (_, __) => const SizedBox.shrink(),

              ),

              const SizedBox(height: 24),

              if (!asset.isFree)

                GradientCtaButton(

                  label: 'Thêm vào giỏ',

                  icon: Icons.add_shopping_cart,

                  loading: _busy,

                  onPressed: _busy ? null : () => _addToCart(asset),

                )

              else

                GradientCtaButton(

                  label: 'Nhận miễn phí (web)',

                  icon: Icons.download,

                  onPressed: () => _snack(

                    'Tải miễn phí qua đơn asset — dùng marketplace web hoặc thư viện sau khi nhận.',

                  ),

                ),

            ],

          );

        },

        loading: () => const Center(

          child: CircularProgressIndicator(color: AppColors.primary),

        ),

        error: (e, _) => EmptyState(

          icon: Icons.error_outline,

          title: 'Không tải được asset',

          subtitle: e.toString(),

          action: GradientCtaButton(

            label: 'Quay lại',

            expand: false,

            onPressed: () => context.pop(),

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

    } catch (e) {

      if (mounted) {

        ScaffoldMessenger.of(context).showSnackBar(

          SnackBar(content: Text(e.toString())),

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

          SectionHeader(title: 'Đánh giá (${items.length})'),

          ...items.take(5).map(

                (r) => ListTile(

                  contentPadding: EdgeInsets.zero,

                  leading: CircleAvatar(child: Text(r.userName.isNotEmpty ? r.userName[0] : '?')),

                  title: Row(

                    children: [

                      Text(r.userName),

                      const SizedBox(width: 8),

                      ...List.generate(

                        5,

                        (i) => Icon(

                          i < r.rating ? Icons.star : Icons.star_border,

                          size: 14,

                          color: AppColors.warning,

                        ),

                      ),

                    ],

                  ),

                  subtitle: r.comment != null ? Text(r.comment!) : null,

                ),

              ),

          if (ref.watch(authProvider).isLoggedIn) ...[

            const SizedBox(height: 8),

            Row(

              children: List.generate(

                5,

                (i) => IconButton(

                  padding: EdgeInsets.zero,

                  constraints: const BoxConstraints(),

                  icon: Icon(

                    i < _rating ? Icons.star : Icons.star_border,

                    color: AppColors.warning,

                  ),

                  onPressed: () => setState(() => _rating = i + 1),

                ),

              ),

            ),

            TextField(

              controller: _comment,

              decoration: const InputDecoration(

                hintText: 'Viết đánh giá...',

              ),

            ),

            const SizedBox(height: 8),

            TextButton(onPressed: _submit, child: const Text('Gửi đánh giá')),

          ],

        ],

      ),

      loading: () => const LinearProgressIndicator(color: AppColors.primary),

      error: (_, __) => const SizedBox.shrink(),

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

        color: AppColors.card,

        borderRadius: BorderRadius.circular(8),

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


