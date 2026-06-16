import '../models/asset_models.dart';
import '../models/billing_models.dart';
import '../models/commerce_models.dart';
import '../models/common_models.dart';
import 'api_client.dart';

class LookupService {
  LookupService(this._client);

  final ApiClient _client;

  Future<List<CategoryItem>> fetchCategories() async {
    final res = await _client.get<Map<String, dynamic>>(
      '/categories',
      auth: false,
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(CategoryItem.fromJson)
        .toList();
  }

  Future<List<TagItem>> fetchTags({String? groupId}) async {
    final q = groupId != null ? '?groupId=$groupId' : '';
    final res = await _client.get<Map<String, dynamic>>(
      '/tags$q',
      auth: false,
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data.whereType<Map<String, dynamic>>().map(TagItem.fromJson).toList();
  }

  Future<List<TagGroupItem>> fetchTagGroups() async {
    final res = await _client.get<Map<String, dynamic>>(
      '/tag-groups',
      auth: false,
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(TagGroupItem.fromJson)
        .toList();
  }
}

class WalletService {
  WalletService(this._client);

  final ApiClient _client;

  Future<PagedResponse<WalletTransaction>> fetchTransactions({
    int page = 1,
    int pageSize = 20,
  }) =>
      _client.get(
        '/wallets/me/transactions?page=$page&pageSize=$pageSize',
        parser: (d) => PagedResponse.fromJson(
          d as Map<String, dynamic>,
          WalletTransaction.fromJson,
        ),
      );
}

class SubscriptionService {
  SubscriptionService(this._client);

  final ApiClient _client;

  Future<List<SubscriptionPlan>> fetchPlans({bool activeOnly = true}) async {
    final res = await _client.get<Map<String, dynamic>>(
      '/subscription-plans?activeOnly=$activeOnly',
      auth: false,
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(SubscriptionPlan.fromJson)
        .toList();
  }

  Future<SubscriptionPlan> fetchPlanBySlug(String slug) => _client.get(
        '/subscription-plans/slug/$slug?activeOnly=true',
        auth: false,
        parser: (d) => SubscriptionPlan.fromJson(d as Map<String, dynamic>),
      );
}

class CustomerSubscriptionService {
  CustomerSubscriptionService(this._client);

  final ApiClient _client;

  Future<SubscriptionMe> fetchMySubscription() => _client.get(
        '/subscriptions/me',
        parser: (d) => SubscriptionMe.fromJson(d as Map<String, dynamic>),
      );

  Future<List<SubscriptionHistoryItem>> fetchHistory() => _client.get(
        '/subscriptions/me/history',
        parser: (d) => (d as List<dynamic>)
            .whereType<Map<String, dynamic>>()
            .map(SubscriptionHistoryItem.fromJson)
            .toList(),
      );

  Future<void> cancelSubscription() =>
      _client.post<void>('/subscriptions/cancel');
}

class UserAssetService {
  UserAssetService(this._client);

  final ApiClient _client;

  Future<List<UserAssetItem>> fetchUserAssets() => _client.get(
        '/user-assets',
        parser: (d) => (d as List<dynamic>)
            .whereType<Map<String, dynamic>>()
            .map(UserAssetItem.fromJson)
            .toList(),
      );

  Future<UserAssetDetail> fetchDetail(String assetId) => _client.get(
        '/user-assets/$assetId',
        parser: (d) => UserAssetDetail.fromJson(d as Map<String, dynamic>),
      );

  Future<UserAssetDetail> registerDownload(String assetId) => _client.post(
        '/user-assets/$assetId/download',
        parser: (d) => UserAssetDetail.fromJson(d as Map<String, dynamic>),
      );

  Future<List<int>> downloadFileBytes(String assetId) async {
    try {
      return await _client.downloadBytes('/user-assets/$assetId/file');
    } catch (_) {
      return _client.downloadBytes('/assets/$assetId/download/file');
    }
  }

  Future<void> removeFromLibrary(String assetId) =>
      _client.delete<void>('/user-assets/$assetId');
}
