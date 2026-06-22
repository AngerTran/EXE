import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/asset_models.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/asset_card.dart';
import '../../widgets/common_widgets.dart';

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  String? _categoryId;
  String? _priceType;
  String? _tag;
  String _sort = 'downloadCount';
  int _page = 1;
  final _assets = <AssetListItem>[];
  bool _loading = false;
  bool _hasMore = true;
  String? _error;
  int _total = 0;
  bool _filtersExpanded = false;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _assets.clear();
      _error = null;
      _total = 0;
    }
    if (!_hasMore) return;

    setState(() => _loading = true);
    try {
      final service = await ref.read(assetServiceProvider.future);
      final res = await service.fetchAssets(
        search: _search.isEmpty ? null : _search,
        categoryId: _categoryId,
        priceType: _priceType,
        tag: _tag,
        sort: _sort,
        order: 'desc',
        page: _page,
        pageSize: 20,
      );
      setState(() {
        _assets.addAll(res.data);
        _total = res.total;
        _hasMore = _assets.length < res.total;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = friendlyErrorMessage(e);
        _loading = false;
      });
    }
  }

  bool get _hasActiveFilters =>
      _priceType != null || _categoryId != null || _tag != null;

  Future<void> _toggleBookmark(String assetId, bool isBookmarked) async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    try {
      final svc = await ref.read(bookmarksServiceProvider.future);
      if (isBookmarked) {
        await svc.removeBookmark(assetId);
      } else {
        await svc.addBookmark(assetId);
      }
      ref.invalidate(bookmarkIdsProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(friendlyErrorMessage(e)),
          backgroundColor: AppColors.destructive,
        ),
      );
    }
  }

  Future<void> _addToCart(AssetListItem asset) async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    final err = await ref.read(cartProvider.notifier).addItem(asset.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(err ?? 'Đã thêm vào giỏ hàng'),
        backgroundColor: err != null ? AppColors.destructive : AppColors.card,
      ),
    );
  }

  Future<void> _buyNow(AssetListItem asset, {required bool isInCart}) async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    if (!isInCart) {
      final err = await ref.read(cartProvider.notifier).addItem(asset.id);
      if (err != null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err),
            backgroundColor: AppColors.destructive,
          ),
        );
        return;
      }
    }
    if (!mounted) return;
    context.push('/checkout/assets');
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(_categoriesProvider);
    final tags = ref.watch(_tagsProvider);
    final cart = ref.watch(cartProvider);
    final bookmarks = ref.watch(bookmarkIdsProvider);
    final userAssets = ref.watch(userAssetsListProvider);

    final cartAssetIds = cart.maybeWhen(
      data: (c) => c.items.map((i) => i.assetId).toSet(),
      orElse: () => <String>{},
    );
    final purchasedIds = userAssets.maybeWhen(
      data: (items) => items.map((a) => a.assetId).toSet(),
      orElse: () => <String>{},
    );
    final bookmarkIds = bookmarks.maybeWhen(
      data: (ids) => ids,
      orElse: () => <String>{},
    );

    ref.listen(userAssetsListProvider, (previous, next) {
      final prevLen = previous?.asData?.value.length;
      final nextLen = next.asData?.value.length;
      if (prevLen != null &&
          nextLen != null &&
          nextLen != prevLen &&
          !_loading) {
        _load(reset: true);
      }
    });

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.page,
              AppSpacing.sm,
              AppSpacing.page,
              0,
            ),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.card.withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(
                  color: _hasActiveFilters
                      ? AppColors.primary.withValues(alpha: 0.35)
                      : AppColors.border,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchCtrl,
                textInputAction: TextInputAction.search,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.foreground,
                    ),
                decoration: InputDecoration(
                  hintText: 'Tìm asset theo tên, thể loại...',
                  hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.muted,
                      ),
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: AppColors.primary,
                  ),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_search.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 20),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _search = '');
                            _load(reset: true);
                          },
                        ),
                      IconButton(
                        icon: Badge(
                          isLabelVisible: _hasActiveFilters,
                          smallSize: 8,
                          backgroundColor: AppColors.primary,
                          child: Icon(
                            _filtersExpanded
                                ? Icons.filter_list_off_rounded
                                : Icons.tune_rounded,
                            color: _hasActiveFilters
                                ? AppColors.primary
                                : AppColors.mutedForeground,
                          ),
                        ),
                        tooltip: 'Bộ lọc',
                        onPressed: () => setState(
                          () => _filtersExpanded = !_filtersExpanded,
                        ),
                      ),
                    ],
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onSubmitted: (v) {
                  setState(() => _search = v.trim());
                  _load(reset: true);
                },
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
              children: [
                _FilterChip(
                  label: 'Phổ biến',
                  selected: _sort == 'downloadCount' && _priceType == null,
                  onTap: () {
                    setState(() {
                      _sort = 'downloadCount';
                      _priceType = null;
                    });
                    _load(reset: true);
                  },
                ),
                _FilterChip(
                  label: 'Miễn phí',
                  selected: _priceType == 'free',
                  onTap: () {
                    setState(() => _priceType = 'free');
                    _load(reset: true);
                  },
                ),
                _FilterChip(
                  label: 'Mới nhất',
                  selected: _sort == 'createdAt',
                  onTap: () {
                    setState(() => _sort = 'createdAt');
                    _load(reset: true);
                  },
                ),
                if (_hasActiveFilters)
                  _FilterChip(
                    label: 'Xóa lọc',
                    selected: false,
                    icon: Icons.filter_alt_off_outlined,
                    onTap: () {
                      setState(() {
                        _priceType = null;
                        _categoryId = null;
                        _tag = null;
                      });
                      _load(reset: true);
                    },
                  ),
              ],
            ),
          ),
          if (_filtersExpanded) ...[
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
              child: Row(
                children: [
                  Text(
                    'Giá',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _FilterChip(
                            label: 'Tất cả',
                            selected: _priceType == null,
                            onTap: () {
                              setState(() => _priceType = null);
                              _load(reset: true);
                            },
                          ),
                          _FilterChip(
                            label: 'Miễn phí',
                            selected: _priceType == 'free',
                            onTap: () {
                              setState(() => _priceType = 'free');
                              _load(reset: true);
                            },
                          ),
                          _FilterChip(
                            label: 'Trả phí',
                            selected: _priceType == 'paid',
                            onTap: () {
                              setState(() => _priceType = 'paid');
                              _load(reset: true);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
              child: Row(
                children: [
                  Text(
                    'Sắp xếp',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _FilterChip(
                    label: 'Phổ biến',
                    selected: _sort == 'downloadCount',
                    onTap: () {
                      setState(() => _sort = 'downloadCount');
                      _load(reset: true);
                    },
                  ),
                  _FilterChip(
                    label: 'Mới nhất',
                    selected: _sort == 'createdAt',
                    onTap: () {
                      setState(() => _sort = 'createdAt');
                      _load(reset: true);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            categories.when(
              data: (cats) => _FilterRow(
                label: 'Danh mục',
                children: [
                  _FilterChip(
                    label: 'Tất cả',
                    selected: _categoryId == null,
                    onTap: () {
                      setState(() => _categoryId = null);
                      _load(reset: true);
                    },
                  ),
                  ...cats.map(
                    (c) => _FilterChip(
                      label: c.name,
                      selected: _categoryId == c.id,
                      onTap: () {
                        setState(() => _categoryId = c.id);
                        _load(reset: true);
                      },
                    ),
                  ),
                ],
              ),
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.page),
                child: LinearProgressIndicator(color: AppColors.primary),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
                child: Text(
                  friendlyErrorMessage(e),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.destructive,
                      ),
                ),
              ),
            ),
            tags.when(
              data: (tagList) {
                if (tagList.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: _FilterRow(
                    label: 'Tags',
                    children: tagList.take(16).map((t) {
                      return _FilterChip(
                        label: t.name,
                        selected: _tag == t.slug,
                        onTap: () {
                          setState(() => _tag = _tag == t.slug ? null : t.slug);
                          _load(reset: true);
                        },
                      );
                    }).toList(),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
            ),
            if (_hasActiveFilters)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.page,
                  AppSpacing.sm,
                  AppSpacing.page,
                  0,
                ),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () {
                      setState(() {
                        _priceType = null;
                        _categoryId = null;
                        _tag = null;
                      });
                      _load(reset: true);
                    },
                    icon: const Icon(Icons.filter_alt_off_outlined, size: 18),
                    label: const Text('Xóa bộ lọc'),
                  ),
                ),
              ),
          ],
          if (_assets.isNotEmpty || _total > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.page,
                AppSpacing.md,
                AppSpacing.page,
                AppSpacing.xs,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Text(
                      '${_assets.length} / $_total asset',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                  const Spacer(),
                  if (_loading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                ],
              ),
            ),
          Expanded(
            child: _error != null && _assets.isEmpty
                ? EmptyState(
                    icon: Icons.cloud_off_outlined,
                    title: 'Không tải được marketplace',
                    subtitle: _error,
                    action: GradientCtaButton(
                      label: 'Thử lại',
                      expand: false,
                      onPressed: () => _load(reset: true),
                    ),
                  )
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: () => _load(reset: true),
                    child: _assets.isEmpty && _loading
                        ? const AssetGridSkeleton()
                        : _assets.isEmpty
                            ? ListView(
                                children: const [
                                  SizedBox(height: 48),
                                  EmptyState(
                                    icon: Icons.search_off_rounded,
                                    title: 'Không tìm thấy asset',
                                    subtitle:
                                        'Thử đổi từ khóa hoặc bộ lọc khác.',
                                  ),
                                ],
                              )
                            : GridView.builder(
                                padding: const EdgeInsets.all(AppSpacing.page),
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: AppSpacing.md,
                                  crossAxisSpacing: AppSpacing.md,
                                  childAspectRatio: kAssetGridAspectRatio,
                                ),
                                itemCount: _assets.length + (_hasMore ? 1 : 0),
                                itemBuilder: (context, i) {
                                  if (i >= _assets.length) {
                                    _load();
                                    return const Center(
                                      child: Padding(
                                        padding: EdgeInsets.all(
                                          AppSpacing.lg,
                                        ),
                                        child: CircularProgressIndicator(
                                          color: AppColors.primary,
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    );
                                  }
                                  final asset = _assets[i];
                                  final isBookmarked =
                                      bookmarkIds.contains(asset.id);
                                  final isInCart =
                                      cartAssetIds.contains(asset.id);
                                  final isPurchased =
                                      purchasedIds.contains(asset.id);
                                  return AssetCard(
                                    asset: asset,
                                    marketplaceStyle: true,
                                    isBookmarked: isBookmarked,
                                    isInCart: isInCart,
                                    isPurchased: isPurchased,
                                    onTap: () => context.push(
                                      '/marketplace/${asset.id}',
                                    ),
                                    onToggleBookmark: () => _toggleBookmark(
                                      asset.id,
                                      isBookmarked,
                                    ),
                                    onAddToCart: () => _addToCart(asset),
                                    onBuyNow: () => _buyNow(
                                      asset,
                                      isInCart: isInCart,
                                    ),
                                    onViewOwned: isPurchased
                                        ? () => context.push(
                                              '/library/${asset.id}',
                                            )
                                        : null,
                                  );
                                },
                              ),
                  ),
          ),
        ],
      ),
    );
  }
}

final _categoriesProvider = FutureProvider<List<CategoryItem>>((ref) async {
  final service = await ref.watch(lookupServiceProvider.future);
  return service.fetchCategories();
});

final _tagsProvider = FutureProvider<List<TagItem>>((ref) async {
  final service = await ref.watch(lookupServiceProvider.future);
  return service.fetchTags();
});

class _FilterRow extends StatelessWidget {
  const _FilterRow({required this.label, required this.children});

  final String label;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: SizedBox(
              width: 64,
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: children),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: FilterChip(
        avatar: icon != null
            ? Icon(
                icon,
                size: 16,
                color: selected ? AppColors.primary : AppColors.mutedForeground,
              )
            : null,
        label: Text(label),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary.withValues(alpha: 0.2),
        labelStyle: TextStyle(
          color: selected ? AppColors.primary : AppColors.mutedForeground,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 12,
        ),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.border,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 2),
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}
