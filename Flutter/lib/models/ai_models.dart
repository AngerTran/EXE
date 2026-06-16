class AiSuggestedAsset {
  AiSuggestedAsset({
    required this.assetId,
    required this.title,
    this.thumbnailUrl,
    this.relevanceScore,
  });

  final String assetId;
  final String title;
  final String? thumbnailUrl;
  final double? relevanceScore;

  factory AiSuggestedAsset.fromJson(Map<String, dynamic> json) =>
      AiSuggestedAsset(
        assetId: json['assetId'] as String,
        title: json['title'] as String,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        relevanceScore: (json['relevanceScore'] as num?)?.toDouble(),
      );
}

class AiMessage {
  AiMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.xuCharged,
    required this.createdAt,
    this.suggestedAssets,
    this.assetSuggestionStatus,
  });

  final String id;
  final String role;
  final String content;
  final int xuCharged;
  final String createdAt;
  final List<AiSuggestedAsset>? suggestedAssets;
  final String? assetSuggestionStatus;

  bool get isUser => role == 'user';

  factory AiMessage.fromJson(Map<String, dynamic> json) => AiMessage(
        id: json['id'] as String,
        role: json['role'] as String,
        content: json['content'] as String,
        xuCharged: (json['xuCharged'] as num?)?.toInt() ?? 0,
        createdAt: json['createdAt'] as String? ?? '',
        suggestedAssets: (json['suggestedAssets'] as List<dynamic>?)
            ?.whereType<Map<String, dynamic>>()
            .map(AiSuggestedAsset.fromJson)
            .toList(),
        assetSuggestionStatus: json['assetSuggestionStatus'] as String?,
      );
}

class AiSessionListItem {
  AiSessionListItem({
    required this.id,
    required this.title,
    required this.totalXuUsed,
    required this.messageCount,
    required this.isArchived,
    required this.updatedAt,
  });

  final String id;
  final String title;
  final int totalXuUsed;
  final int messageCount;
  final bool isArchived;
  final String updatedAt;

  factory AiSessionListItem.fromJson(Map<String, dynamic> json) =>
      AiSessionListItem(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Phiên mới',
        totalXuUsed: (json['totalXuUsed'] as num?)?.toInt() ?? 0,
        messageCount: (json['messageCount'] as num?)?.toInt() ?? 0,
        isArchived: json['isArchived'] as bool? ?? false,
        updatedAt: json['updatedAt'] as String? ?? '',
      );
}

class AiSessionDetail {
  AiSessionDetail({
    required this.id,
    required this.title,
    required this.isArchived,
    required this.messages,
  });

  final String id;
  final String title;
  final bool isArchived;
  final List<AiMessage> messages;

  factory AiSessionDetail.fromJson(Map<String, dynamic> json) =>
      AiSessionDetail(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Phiên mới',
        isArchived: json['isArchived'] as bool? ?? false,
        messages: (json['messages'] as List<dynamic>?)
                ?.whereType<Map<String, dynamic>>()
                .map(AiMessage.fromJson)
                .toList() ??
            [],
      );
}

class SendAiMessageResult {
  SendAiMessageResult({
    required this.userMessage,
    required this.assistantMessage,
    required this.walletBalance,
    required this.isUnlimited,
  });

  final AiMessage userMessage;
  final AiMessage assistantMessage;
  final int walletBalance;
  final bool isUnlimited;

  factory SendAiMessageResult.fromJson(Map<String, dynamic> json) =>
      SendAiMessageResult(
        userMessage:
            AiMessage.fromJson(json['userMessage'] as Map<String, dynamic>),
        assistantMessage: AiMessage.fromJson(
          json['assistantMessage'] as Map<String, dynamic>,
        ),
        walletBalance: (json['walletBalance'] as num?)?.toInt() ?? 0,
        isUnlimited: json['isUnlimited'] as bool? ?? false,
      );
}

class AiOutlineResult {
  AiOutlineResult({
    required this.content,
    required this.walletBalance,
    required this.isUnlimited,
  });

  final String content;
  final int walletBalance;
  final bool isUnlimited;

  factory AiOutlineResult.fromJson(Map<String, dynamic> json) =>
      AiOutlineResult(
        content: json['content'] as String? ?? '',
        walletBalance: (json['walletBalance'] as num?)?.toInt() ?? 0,
        isUnlimited: json['isUnlimited'] as bool? ?? false,
      );
}
