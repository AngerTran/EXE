import '../models/asset_models.dart';
import '../models/common_models.dart';
import 'api_client.dart';

class AssetService {
  AssetService(this._client);

  final ApiClient _client;

  Future<PagedResponse<AssetListItem>> fetchAssets({
    String? search,
    String? categoryId,
    String? priceType,
    String? tag,
    bool featured = false,
    int page = 1,
    int pageSize = 20,
    String? sort,
    String? order,
  }) async {
    final q = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
    };
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (categoryId != null) q['categoryId'] = categoryId;
    if (priceType != null) q['priceType'] = priceType;
    if (tag != null) q['tag'] = tag;
    if (featured) q['featured'] = 'true';
    if (sort != null) q['sort'] = sort;
    if (order != null) q['order'] = order;

    final query = q.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');

    return _client.get(
      '/assets?$query',
      auth: false,
      parser: (d) => PagedResponse.fromJson(
        d as Map<String, dynamic>,
        AssetListItem.fromJson,
      ),
    );
  }

  Future<AssetDetail> fetchAssetById(String id) => _client.get(
        '/assets/$id',
        auth: false,
        parser: (d) => AssetDetail.fromJson(d as Map<String, dynamic>),
      );
}
