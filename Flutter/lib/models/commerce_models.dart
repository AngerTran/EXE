import 'billing_models.dart';

class CartAssetPreview {
  CartAssetPreview({
    required this.id,
    required this.title,
    this.thumbnailUrl,
    required this.categoryName,
    required this.priceType,
    required this.priceVnd,
    required this.isFree,
  });

  final String id;
  final String title;
  final String? thumbnailUrl;
  final String categoryName;
  final String priceType;
  final int priceVnd;
  final bool isFree;

  factory CartAssetPreview.fromJson(Map<String, dynamic> json) =>
      CartAssetPreview(
        id: json['id'] as String,
        title: json['title'] as String,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        categoryName: json['categoryName'] as String? ?? '',
        priceType: json['priceType'] as String? ?? 'paid',
        priceVnd: (json['priceVnd'] as num?)?.toInt() ?? 0,
        isFree: json['isFree'] as bool? ?? false,
      );
}

class CartItem {
  CartItem({
    required this.id,
    required this.assetId,
    required this.quantity,
    required this.asset,
    required this.lineTotalVnd,
  });

  final String id;
  final String assetId;
  final int quantity;
  final CartAssetPreview asset;
  final int lineTotalVnd;

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['id'] as String,
        assetId: json['assetId'] as String,
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        asset: CartAssetPreview.fromJson(
          json['asset'] as Map<String, dynamic>,
        ),
        lineTotalVnd: (json['lineTotalVnd'] as num?)?.toInt() ?? 0,
      );
}

class Cart {
  Cart({
    required this.items,
    required this.subtotalVnd,
    required this.itemCount,
  });

  final List<CartItem> items;
  final int subtotalVnd;
  final int itemCount;

  factory Cart.fromJson(Map<String, dynamic> json) => Cart(
        items: (json['items'] as List<dynamic>?)
                ?.whereType<Map<String, dynamic>>()
                .map(CartItem.fromJson)
                .toList() ??
            [],
        subtotalVnd: (json['subtotalVnd'] as num?)?.toInt() ?? 0,
        itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      );
}

class OrderItem {
  OrderItem({
    required this.id,
    this.assetId,
    this.planId,
    required this.itemName,
    required this.unitPriceVnd,
    required this.quantity,
    required this.lineTotalVnd,
  });

  final String id;
  final String? assetId;
  final String? planId;
  final String itemName;
  final int unitPriceVnd;
  final int quantity;
  final int lineTotalVnd;

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        id: json['id'] as String,
        assetId: json['assetId'] as String?,
        planId: json['planId'] as String?,
        itemName: json['itemName'] as String? ?? '',
        unitPriceVnd: (json['unitPriceVnd'] as num?)?.toInt() ?? 0,
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        lineTotalVnd: (json['lineTotalVnd'] as num?)?.toInt() ?? 0,
      );
}

class Order {
  Order({
    required this.id,
    required this.orderCode,
    required this.orderType,
    required this.status,
    required this.subtotalVnd,
    required this.discountVnd,
    required this.totalVnd,
    required this.totalXu,
    this.completedAt,
    required this.createdAt,
    required this.items,
    this.paymentId,
    this.paymentRedirectUrl,
  });

  final String id;
  final String orderCode;
  final String orderType;
  final String status;
  final int subtotalVnd;
  final int discountVnd;
  final int totalVnd;
  final int totalXu;
  final String? completedAt;
  final String createdAt;
  final List<OrderItem> items;
  final String? paymentId;
  final String? paymentRedirectUrl;

  bool get isCompleted => status == 'completed';
  bool get isPending => status == 'pending';

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        orderCode: json['orderCode'] as String? ?? '',
        orderType: json['orderType'] as String? ?? '',
        status: json['status'] as String? ?? 'pending',
        subtotalVnd: (json['subtotalVnd'] as num?)?.toInt() ?? 0,
        discountVnd: (json['discountVnd'] as num?)?.toInt() ?? 0,
        totalVnd: (json['totalVnd'] as num?)?.toInt() ?? 0,
        totalXu: (json['totalXu'] as num?)?.toInt() ?? 0,
        completedAt: json['completedAt'] as String?,
        createdAt: json['createdAt'] as String? ?? '',
        items: (json['items'] as List<dynamic>?)
                ?.whereType<Map<String, dynamic>>()
                .map(OrderItem.fromJson)
                .toList() ??
            [],
        paymentId: json['paymentId'] as String?,
        paymentRedirectUrl: json['paymentRedirectUrl'] as String?,
      );
}

class OrdersSummary {
  OrdersSummary({
    required this.totalOrders,
    required this.totalSpentVnd,
    required this.completedOrders,
    required this.pendingOrders,
  });

  final int totalOrders;
  final int totalSpentVnd;
  final int completedOrders;
  final int pendingOrders;

  factory OrdersSummary.fromJson(Map<String, dynamic> json) => OrdersSummary(
        totalOrders: (json['totalOrders'] as num?)?.toInt() ?? 0,
        totalSpentVnd: (json['totalSpentVnd'] as num?)?.toInt() ?? 0,
        completedOrders: (json['completedOrders'] as num?)?.toInt() ?? 0,
        pendingOrders: (json['pendingOrders'] as num?)?.toInt() ?? 0,
      );
}

class BankTransferInfo {
  BankTransferInfo({
    required this.bankBin,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
    this.qrImageUrl,
    this.vietQrImageUrl,
  });

  final String bankBin;
  final String bankName;
  final String accountNumber;
  final String accountHolder;
  final String? qrImageUrl;
  final String? vietQrImageUrl;

  String? get qrUrl => qrImageUrl ?? vietQrImageUrl;

  factory BankTransferInfo.fromJson(Map<String, dynamic> json) =>
      BankTransferInfo(
        bankBin: json['bankBin'] as String? ?? '',
        bankName: json['bankName'] as String? ?? '',
        accountNumber: json['accountNumber'] as String? ?? '',
        accountHolder: json['accountHolder'] as String? ?? '',
        qrImageUrl: json['qrImageUrl'] as String?,
        vietQrImageUrl: json['vietQrImageUrl'] as String?,
      );
}

class ReviewItem {
  ReviewItem({
    required this.id,
    required this.assetId,
    required this.userName,
    required this.rating,
    this.comment,
    required this.createdAt,
    required this.isOwn,
  });

  final String id;
  final String assetId;
  final String userName;
  final int rating;
  final String? comment;
  final String createdAt;
  final bool isOwn;

  factory ReviewItem.fromJson(Map<String, dynamic> json) => ReviewItem(
        id: json['id'] as String,
        assetId: json['assetId'] as String,
        userName: json['userName'] as String? ?? '',
        rating: (json['rating'] as num?)?.toInt() ?? 0,
        comment: json['comment'] as String?,
        createdAt: json['createdAt'] as String? ?? '',
        isOwn: json['isOwn'] as bool? ?? false,
      );
}

class TagItem {
  TagItem({
    required this.id,
    required this.name,
    required this.slug,
    this.groupId,
    required this.usageCount,
  });

  final String id;
  final String name;
  final String slug;
  final String? groupId;
  final int usageCount;

  factory TagItem.fromJson(Map<String, dynamic> json) => TagItem(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        groupId: json['groupId'] as String?,
        usageCount: (json['usageCount'] as num?)?.toInt() ?? 0,
      );
}

class TagGroupItem {
  TagGroupItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.sortOrder,
  });

  final String id;
  final String name;
  final String slug;
  final int sortOrder;

  factory TagGroupItem.fromJson(Map<String, dynamic> json) => TagGroupItem(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );
}

class UserAssetDetail extends UserAssetItem {
  UserAssetDetail({
    required super.assetId,
    required super.title,
    required super.slug,
    required super.categoryName,
    super.thumbnailUrl,
    required super.acquiredVia,
    required super.downloadCount,
    super.lastDownloadAt,
    required super.acquiredAt,
    required super.isDelisted,
    super.fileSizeBytes,
    super.primaryFileName,
    super.paidXu,
    this.shortDescription,
    this.downloadUrl,
    this.downloadExpiresInSeconds,
  });

  final String? shortDescription;
  final String? downloadUrl;
  final int? downloadExpiresInSeconds;

  factory UserAssetDetail.fromJson(Map<String, dynamic> json) =>
      UserAssetDetail(
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
        shortDescription: json['shortDescription'] as String?,
        downloadUrl: json['downloadUrl'] as String?,
        downloadExpiresInSeconds:
            (json['downloadExpiresInSeconds'] as num?)?.toInt(),
      );
}