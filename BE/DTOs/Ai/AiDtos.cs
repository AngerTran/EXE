using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Ai;

public record AiSessionListItemResponse(
    Guid Id,
    string Title,
    int TotalXuUsed,
    bool IsArchived,
    DateTime UpdatedAt);

public record CreateAiSessionRequest(string? Title);

public record UpdateAiSessionRequest(
    string? Title,
    bool? IsArchived);

public record AiSuggestedAssetResponse(
    Guid AssetId,
    string Title,
    string? ThumbnailUrl,
    decimal? RelevanceScore);

public record AiMessageResponse(
    Guid Id,
    string Role,
    string Content,
    int XuCharged,
    DateTime CreatedAt,
    IReadOnlyList<AiSuggestedAssetResponse>? SuggestedAssets);

public record AiSessionDetailResponse(
    Guid Id,
    string Title,
    bool IsArchived,
    IReadOnlyList<AiMessageResponse> Messages);

public record SendAiMessageRequest(
    [Required, MaxLength(8000)] string Content);

public record SendAiMessageResponse(
    AiMessageResponse UserMessage,
    AiMessageResponse AssistantMessage,
    int WalletBalance,
    bool IsUnlimited);

public record AiExportResponse(string Format, string Content);
