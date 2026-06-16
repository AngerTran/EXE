import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
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
  String _order = 'desc';
  int _page = 1;
  final _assets = <AssetListItem>[];
  bool _loading = false;
  bool _hasMore = true;
  String? _error;

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
        order: _order,
        page: _page,
        pageSize: 20,
      );
      setState(() {
        _assets.addAll(res.data);
        _hasMore = _assets.length < res.total;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(_categoriesProvider);
    final tags = ref.watch(_tagsProvider);

    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Tìm asset...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _search.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _search = '');
                                _load(reset: true);
                              },
                            )
                          : null,
                    ),
                    onSubmitted: (v) {
                      setState(() => _search = v.trim());
                      _load(reset: true);
                    },
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.bookmark_border),
                  onPressed: () => context.push('/bookmarks'),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _FilterChip(
                  label: 'Tất cả giá',
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
                PopupMenuButton<String>(
                  icon: const Icon(Icons.sort, color: AppColors.primary),
                  onSelected: (v) {
                    setState(() {
                      _sort = v == 'newest' ? 'createdAt' : 'downloadCount';
                      _order = 'desc';
                    });
                    _load(reset: true);
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'popular', child: Text('Phổ biến')),
                    PopupMenuItem(value: 'newest', child: Text('Mới nhất')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          categories.when(
            data: (cats) => SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
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
            ),
            loading: () => const SizedBox(height: 40),
            error: (_, __) => const SizedBox.shrink(),
          ),
          tags.when(
            data: (tagList) {
              if (tagList.isEmpty) return const SizedBox.shrink();
              return SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: tagList.take(12).map((t) => _FilterChip(
                        label: t.name,
                        selected: _tag == t.slug,
                        onTap: () {
                          setState(() =>
                              _tag = _tag == t.slug ? null : t.slug);
                          _load(reset: true);
                        },
                      )).toList(),
                ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 4),
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
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.primary,
                            ),
                          )
                        : GridView.builder(
                            padding: const EdgeInsets.all(16),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.72,
                            ),
                            itemCount: _assets.length + (_hasMore ? 1 : 0),
                            itemBuilder: (context, i) {
                              if (i >= _assets.length) {
                                _load();
                                return const Center(
                                  child: CircularProgressIndicator(
                                    color: AppColors.primary,
                                  ),
                                );
                              }
                              final asset = _assets[i];
                              return AssetCard(
                                asset: asset,
                                onTap: () =>
                                    context.push('/marketplace/${asset.id}'),
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
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary.withValues(alpha: 0.2),
        checkmarkColor: AppColors.primary,
        labelStyle: TextStyle(
          color: selected ? AppColors.primary : AppColors.mutedForeground,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
        ),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.border,
        ),
      ),
    );
  }
}
