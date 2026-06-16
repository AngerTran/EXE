import '../models/ai_models.dart';
import 'api_client.dart';

class AiService {
  AiService(this._client);

  final ApiClient _client;

  Future<List<AiSessionListItem>> fetchSessions() => _client.get(
        '/ai/sessions',
        parser: (d) => (d as List<dynamic>)
            .whereType<Map<String, dynamic>>()
            .map(AiSessionListItem.fromJson)
            .toList(),
      );

  Future<AiSessionDetail> createSession({String? title}) => _client.post(
        '/ai/sessions',
        data: {if (title != null) 'title': title},
        parser: (d) => AiSessionDetail.fromJson(d as Map<String, dynamic>),
      );

  Future<AiSessionDetail> fetchSession(String id) => _client.get(
        '/ai/sessions/$id',
        parser: (d) => AiSessionDetail.fromJson(d as Map<String, dynamic>),
      );

  Future<SendAiMessageResult> sendMessage(String sessionId, String content) =>
      _client.post(
        '/ai/sessions/$sessionId/messages',
        data: {'content': content},
        parser: (d) =>
            SendAiMessageResult.fromJson(d as Map<String, dynamic>),
      );

  Future<void> deleteSession(String id) =>
      _client.delete<void>('/ai/sessions/$id');

  Future<void> cleanupEmptySessions({String? keepId}) {
    final q = keepId != null ? '?keep=${Uri.encodeComponent(keepId)}' : '';
    return _client.delete<void>('/ai/sessions/empty$q');
  }

  Future<Map<String, String>> exportSession(String id) => _client.get(
        '/ai/sessions/$id/export',
        parser: (d) {
          final m = d as Map<String, dynamic>;
          return {
            'format': m['format'] as String? ?? 'markdown',
            'content': m['content'] as String? ?? '',
          };
        },
      );

  Future<AiOutlineResult> generateOutline(String sessionId) => _client.post(
        '/ai/sessions/$sessionId/outline',
        parser: (d) => AiOutlineResult.fromJson(d as Map<String, dynamic>),
      );

  Future<AiOutlineResult> refineOutline(
    String sessionId, {
    required String currentOutline,
    required String instruction,
  }) =>
      _client.post(
        '/ai/sessions/$sessionId/outline/refine',
        data: {
          'currentOutline': currentOutline,
          'instruction': instruction,
        },
        parser: (d) => AiOutlineResult.fromJson(d as Map<String, dynamic>),
      );
}
