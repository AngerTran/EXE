import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../models/asset_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/asset_card.dart';
import '../../widgets/common_widgets.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookmarks = ref.watch(_bookmarksProvider);
    final auth = ref.watch(authProvider);
    final bookmarkIds = ref.watch(bookmarkIdsProvider);
    final userAssets = ref.watch(userAssetsListProvider);

    final purchasedIds = userAssets.maybeWhen(
      data: (items) => items.map((a) => a.assetId).toSet(),
      orElse: () => <String>{},
    );
    final savedIds = bookmarkIds.maybeWhen(
      data: (ids) => ids,
      orElse: () => <String>{},
    );

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Đã lưu')),
        body: EmptyState(
          icon: Icons.bookmark_border,
          title: 'Bookmark',
          subtitle: 'Đăng nhập để lưu asset yêu thích.',
          action: GradientCtaButton(
            label: 'Đăng nhập',
            expand: false,
            onPressed: () => context.push('/auth'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Đã lưu')),
      body: bookmarks.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => EmptyState(
          icon: Icons.error_outline,
          title: 'Không tải được',
          subtitle: e.toString(),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.bookmark_border,
              title: 'Chưa có bookmark',
              subtitle: 'Nhấn icon bookmark trên asset để lưu.',
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async {
              ref.invalidate(_bookmarksProvider);
              ref.invalidate(bookmarkIdsProvider);
            },
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: kAssetGridAspectRatio,
              ),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final asset = items[i];
                return Align(
                  alignment: Alignment.topCenter,
                  child: AssetCard(
                  asset: asset,
                  marketplaceStyle: true,
                  isBookmarked: savedIds.contains(asset.id),
                  isPurchased: purchasedIds.contains(asset.id),
                  onTap: () => context.push('/marketplace/${asset.id}'),
                  onToggleBookmark: () async {
                    try {
                      final svc =
                          await ref.read(bookmarksServiceProvider.future);
                      await svc.removeBookmark(asset.id);
                      ref.invalidate(bookmarkIdsProvider);
                      ref.invalidate(_bookmarksProvider);
                    } catch (_) {}
                  },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

final _bookmarksProvider = FutureProvider<List<AssetListItem>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return [];
  final svc = await ref.watch(bookmarksServiceProvider.future);
  return svc.fetchBookmarks();
});
