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

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(_categoriesProvider);
    final tags = ref.watch(_tagsProvider);

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
            child: TextField(
              controller: _searchCtrl,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Tìm asset theo tên, thể loại...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_search.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear_rounded),
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
                      onPressed: () =>
                          setState(() => _filtersExpanded = !_filtersExpanded),
                    ),
                  ],
                ),
              ),
              onSubmitted: (v) {
                setState(() => _search = v.trim());
                _load(reset: true);
              },
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
              error: (_, __) => const SizedBox.shrink(),
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
              child: Text(
                '${_assets.length} / $_total asset',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
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
                                  childAspectRatio: 0.72,
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
                                  return AssetCard(
                                    asset: asset,
                                    onTap: () => context.push(
                                      '/marketplace/${asset.id}',
                                    ),
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
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm, bottom: AppSpacing.sm),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary.withValues(alpha: 0.2),
        labelStyle: TextStyle(
          color: selected ? AppColors.primary : AppColors.mutedForeground,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 13,
        ),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.border,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 2),
      ),
    );
  }
}
