import '../models/commerce_models.dart';
import 'api_client.dart';

class ReviewsService {
  ReviewsService(this._client);

  final ApiClient _client;

  Future<List<ReviewItem>> fetchAssetReviews(String assetId) => _client.get(
        '/assets/$assetId/reviews',
        auth: false,
        parser: (d) => (d as List<dynamic>)
            .whereType<Map<String, dynamic>>()
            .map(ReviewItem.fromJson)
            .toList(),
      );

  Future<ReviewItem> createReview(
    String assetId,
    int rating, {
    String? comment,
  }) =>
      _client.post(
        '/assets/$assetId/reviews',
        data: {'rating': rating, 'comment': comment?.trim()},
        parser: (d) => ReviewItem.fromJson(d as Map<String, dynamic>),
      );

  Future<void> deleteReview(String id) =>
      _client.delete<void>('/reviews/$id');
}
