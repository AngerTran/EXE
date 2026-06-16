class CategoryItem {
  CategoryItem({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    this.icon,
    required this.sortOrder,
  });

  final String id;
  final String slug;
  final String name;
  final String? description;
  final String? icon;
  final int sortOrder;

  factory CategoryItem.fromJson(Map<String, dynamic> json) => CategoryItem(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        icon: json['icon'] as String?,
        sortOrder: json['sortOrder'] as int? ?? 0,
      );
}

class AssetListItem {
  AssetListItem({
    required this.id,
    required this.slug,
    required this.title,
    this.shortDescription,
    required this.categoryId,
    required this.categoryName,
    required this.uploaderName,
    required this.priceType,
    required this.priceVnd,
    required this.priceXu,
    required this.displayPrice,
    required this.ratingAvg,
    required this.ratingCount,
    required this.downloadCount,
    this.thumbnailUrl,
    required this.tags,
    required this.isFree,
  });

  final String id;
  final String slug;
  final String title;
  final String? shortDescription;
  final String categoryId;
  final String categoryName;
  final String uploaderName;
  final String priceType;
  final int priceVnd;
  final int priceXu;
  final int displayPrice;
  final double ratingAvg;
  final int ratingCount;
  final int downloadCount;
  final String? thumbnailUrl;
  final List<String> tags;
  final bool isFree;

  factory AssetListItem.fromJson(Map<String, dynamic> json) => AssetListItem(
        id: json['id'] as String,
        slug: json['slug'] as String,
        title: json['title'] as String,
        shortDescription: json['shortDescription'] as String?,
        categoryId: json['categoryId'] as String,
        categoryName: json['categoryName'] as String? ?? '',
        uploaderName: json['uploaderName'] as String? ?? '',
        priceType: json['priceType'] as String? ?? 'free',
        priceVnd: (json['priceVnd'] as num?)?.toInt() ?? 0,
        priceXu: (json['priceXu'] as num?)?.toInt() ?? 0,
        displayPrice: (json['displayPrice'] as num?)?.toInt() ?? 0,
        ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        downloadCount: (json['downloadCount'] as num?)?.toInt() ?? 0,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        tags: (json['tags'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        isFree: json['isFree'] as bool? ?? false,
      );
}

class AssetDetail extends AssetListItem {
  AssetDetail({
    required super.id,
    required super.slug,
    required super.title,
    super.shortDescription,
    required super.categoryId,
    required super.categoryName,
    required super.uploaderName,
    required super.priceType,
    required super.priceVnd,
    required super.priceXu,
    required super.displayPrice,
    required super.ratingAvg,
    required super.ratingCount,
    required super.downloadCount,
    super.thumbnailUrl,
    required super.tags,
    required super.isFree,
    this.fullDescription,
    required this.uploaderId,
    this.artStyle,
    required this.license,
    required this.status,
    required this.createdAt,
  });

  final String? fullDescription;
  final String uploaderId;
  final String? artStyle;
  final String license;
  final String status;
  final String createdAt;

  factory AssetDetail.fromJson(Map<String, dynamic> json) => AssetDetail(
        id: json['id'] as String,
        slug: json['slug'] as String,
        title: json['title'] as String,
        shortDescription: json['shortDescription'] as String?,
        categoryId: json['categoryId'] as String,
        categoryName: json['categoryName'] as String? ?? '',
        uploaderName: json['uploaderName'] as String? ?? '',
        priceType: json['priceType'] as String? ?? 'free',
        priceVnd: (json['priceVnd'] as num?)?.toInt() ?? 0,
        priceXu: (json['priceXu'] as num?)?.toInt() ?? 0,
        displayPrice: (json['displayPrice'] as num?)?.toInt() ?? 0,
        ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        downloadCount: (json['downloadCount'] as num?)?.toInt() ?? 0,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        tags: (json['tags'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        isFree: json['isFree'] as bool? ?? false,
        fullDescription: json['fullDescription'] as String?,
        uploaderId: json['uploaderId'] as String? ?? '',
        artStyle: json['artStyle'] as String?,
        license: json['license'] as String? ?? '',
        status: json['status'] as String? ?? '',
        createdAt: json['createdAt'] as String? ?? '',
      );
}
