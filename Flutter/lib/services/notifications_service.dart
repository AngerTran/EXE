import '../models/common_models.dart';
import '../models/notification_models.dart';
import 'api_client.dart';

class NotificationsService {
  NotificationsService(this._client);

  final ApiClient _client;

  Future<PagedResponse<AppNotification>> fetchNotifications({
    int page = 1,
    int pageSize = 50,
    bool unreadOnly = false,
  }) =>
      _client.get(
        '/notifications?page=$page&pageSize=$pageSize'
        '${unreadOnly ? '&unreadOnly=true' : ''}',
        parser: (d) => PagedResponse.fromJson(
          d as Map<String, dynamic>,
          AppNotification.fromJson,
        ),
      );

  Future<int> fetchUnreadCount() => _client.get(
        '/notifications/unread-count',
        parser: (d) =>
            NotificationUnreadCount.fromJson(d as Map<String, dynamic>).count,
      );

  Future<void> markAllRead() => _client.patch('/notifications/read-all');

  Future<void> markRead(String id) =>
      _client.patch('/notifications/$id/read');

  Future<void> deleteAll() => _client.delete('/notifications');

  Future<void> deleteOne(String id) => _client.delete('/notifications/$id');
}
