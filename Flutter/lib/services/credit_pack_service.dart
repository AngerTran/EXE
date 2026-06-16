import '../models/billing_models.dart';
import 'api_client.dart';

class CreditPackService {
  CreditPackService(this._client);

  final ApiClient _client;

  Future<List<CreditPack>> fetchPacks() async {
    final res = await _client.get<Map<String, dynamic>>(
      '/credit-packs',
      auth: false,
      parser: (d) => d as Map<String, dynamic>,
    );
    final data = res['data'] as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(CreditPack.fromJson)
        .where((p) => p.isActive)
        .toList();
  }
}
