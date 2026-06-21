using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Ai;

public record AiSessionListItemResponse(
    Guid Id,
    string Title,
    int TotalXuUsed,
    int MessageCount,
    bool IsArchived,
    DateTime UpdatedAt);

public record AiCleanupEmptySessionsResponse(int Deleted);

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
    IReadOnlyList<AiSuggestedAssetResponse>? SuggestedAssets,
    // found | not_found | null (null = không tìm asset cho tin nhắn này)
    string? AssetSuggestionStatus = null);

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

public record AiOutlineResponse(
    string Content,
    int WalletBalance,
    bool IsUnlimited);

public record RefineAiOutlineRequest(
    [Required, MaxLength(8000)] string CurrentOutline,
    [Required, MaxLength(2000)] string Instruction);
