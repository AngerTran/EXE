class SubscriptionPlan {
  SubscriptionPlan({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    required this.priceVnd,
    this.creditsMonthly,
    required this.isUnlimited,
    required this.features,
    required this.sortOrder,
    required this.isActive,
  });

  final String id;
  final String slug;
  final String name;
  final String? description;
  final int priceVnd;
  final int? creditsMonthly;
  final bool isUnlimited;
  final List<String> features;
  final int sortOrder;
  final bool isActive;

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) =>
      SubscriptionPlan(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        priceVnd: (json['priceVnd'] as num?)?.toInt() ?? 0,
        creditsMonthly: (json['creditsMonthly'] as num?)?.toInt(),
        isUnlimited: json['isUnlimited'] as bool? ?? false,
        features: (json['features'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        sortOrder: json['sortOrder'] as int? ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class WalletTransaction {
  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    this.description,
    required this.createdAt,
  });

  final String id;
  final String type;
  final int amount;
  final int balanceAfter;
  final String? description;
  final String createdAt;

  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      WalletTransaction(
        id: json['id'] as String,
        type: json['type'] as String? ?? '',
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        balanceAfter: (json['balanceAfter'] as num?)?.toInt() ?? 0,
        description: json['description'] as String?,
        createdAt: json['createdAt'] as String? ?? '',
      );
}

class CreditPack {
  CreditPack({
    required this.id,
    required this.name,
    required this.credits,
    required this.priceVnd,
    this.discountPercent,
    required this.sortOrder,
    required this.isActive,
  });

  final String id;
  final String name;
  final int credits;
  final int priceVnd;
  final int? discountPercent;
  final int sortOrder;
  final bool isActive;

  factory CreditPack.fromJson(Map<String, dynamic> json) => CreditPack(
        id: json['id'] as String,
        name: json['name'] as String,
        credits: (json['credits'] as num?)?.toInt() ?? 0,
        priceVnd: (json['priceVnd'] as num?)?.toInt() ?? 0,
        discountPercent: (json['discountPercent'] as num?)?.toInt(),
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class SubscriptionMe {
  SubscriptionMe({
    this.planSlug,
    this.planName,
    required this.status,
    this.startedAt,
    this.expiredAt,
    required this.isUnlimited,
    this.creditsMonthly,
  });

  final String? planSlug;
  final String? planName;
  final String status;
  final String? startedAt;
  final String? expiredAt;
  final bool isUnlimited;
  final int? creditsMonthly;

  factory SubscriptionMe.fromJson(Map<String, dynamic> json) => SubscriptionMe(
        planSlug: json['planSlug'] as String?,
        planName: json['planName'] as String?,
        status: json['status'] as String? ?? 'none',
        startedAt: json['startedAt'] as String?,
        expiredAt: json['expiredAt'] as String?,
        isUnlimited: json['isUnlimited'] as bool? ?? false,
        creditsMonthly: (json['creditsMonthly'] as num?)?.toInt(),
      );
}

class SubscriptionHistoryItem {
  SubscriptionHistoryItem({
    required this.id,
    required this.planSlug,
    required this.planName,
    required this.status,
    required this.startedAt,
    this.expiredAt,
  });

  final String id;
  final String planSlug;
  final String planName;
  final String status;
  final String startedAt;
  final String? expiredAt;

  factory SubscriptionHistoryItem.fromJson(Map<String, dynamic> json) =>
      SubscriptionHistoryItem(
        id: json['id'] as String,
        planSlug: json['planSlug'] as String? ?? '',
        planName: json['planName'] as String? ?? '',
        status: json['status'] as String? ?? '',
        startedAt: json['startedAt'] as String? ?? '',
        expiredAt: json['expiredAt'] as String?,
      );
}

class UserAssetItem {
  UserAssetItem({
    required this.assetId,
    required this.title,
    required this.slug,
    required this.categoryName,
    this.thumbnailUrl,
    required this.acquiredVia,
    required this.downloadCount,
    this.lastDownloadAt,
    required this.acquiredAt,
    required this.isDelisted,
    this.fileSizeBytes,
    this.primaryFileName,
    this.paidXu,
  });

  final String assetId;
  final String title;
  final String slug;
  final String categoryName;
  final String? thumbnailUrl;
  final String acquiredVia;
  final int downloadCount;
  final String? lastDownloadAt;
  final String acquiredAt;
  final bool isDelisted;
  final int? fileSizeBytes;
  final String? primaryFileName;
  final int? paidXu;

  factory UserAssetItem.fromJson(Map<String, dynamic> json) => UserAssetItem(
        assetId: json['assetId'] as String,
        title: json['title'] as String,
        slug: json['slug'] as String? ?? '',
        categoryName: json['categoryName'] as String? ?? '',
        thumbnailUrl: json['thumbnailUrl'] as String?,
        acquiredVia: json['acquiredVia'] as String? ?? '',
        downloadCount: (json['downloadCount'] as num?)?.toInt() ?? 0,
        lastDownloadAt: json['lastDownloadAt'] as String?,
        acquiredAt: json['acquiredAt'] as String? ?? '',
        isDelisted: json['isDelisted'] as bool? ?? false,
        fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt(),
        primaryFileName: json['primaryFileName'] as String?,
        paidXu: (json['paidXu'] as num?)?.toInt(),
      );
}
