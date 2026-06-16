import '../models/asset_models.dart';
import 'api_client.dart';

class BookmarksService {
  BookmarksService(this._client);

  final ApiClient _client;

  Future<List<AssetListItem>> fetchBookmarks() async {
    final res = await _client.get<Map<String, dynamic>>(
      '/bookmarks',
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(AssetListItem.fromJson)
        .toList();
  }

  Future<void> addBookmark(String assetId) => _client.post<void>(
        '/bookmarks',
        data: {'assetId': assetId},
      );

  Future<void> removeBookmark(String assetId) =>
      _client.delete<void>('/bookmarks/$assetId');
}
