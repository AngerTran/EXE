class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.category,
    required this.title,
    this.description,
    this.actionUrl,
    this.referenceType,
    this.referenceId,
    required this.read,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String category;
  final String title;
  final String? description;
  final String? actionUrl;
  final String? referenceType;
  final String? referenceId;
  final bool read;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'info',
      category: json['category'] as String? ?? 'account',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      actionUrl: json['actionUrl'] as String?,
      referenceType: json['referenceType'] as String?,
      referenceId: json['referenceId'] as String?,
      read: json['read'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

class NotificationUnreadCount {
  NotificationUnreadCount({required this.count});

  final int count;

  factory NotificationUnreadCount.fromJson(Map<String, dynamic> json) {
    return NotificationUnreadCount(count: json['count'] as int? ?? 0);
  }
}
