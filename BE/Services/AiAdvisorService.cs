using System.Text;
using System.Text.Json;
using Exe.Configuration;
using Exe.DTOs.Ai;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Ai;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Wallet;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class AiAdvisorService(
    IAiRepository aiRepository,
    IAssetRepository assetRepository,
    IWalletRepository walletRepository,
    IUnitOfWork unitOfWork,
    ILlmChatService llmChatService,
    IOptions<AiOptions> aiOptions) : IAiAdvisorService
{
    private const int XuPerMessage = 1;

    public async Task<IReadOnlyList<AiSessionListItemResponse>> ListSessionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await aiRepository.ListSessionsAsync(userId, cancellationToken);
        var counts = await aiRepository.GetSessionMessageCountsAsync(
            sessions.Select(s => s.Id).ToList(),
            cancellationToken);
        return sessions
            .Select(s => MapListItem(s, counts.GetValueOrDefault(s.Id)))
            .ToList();
    }

    public async Task<AiSessionDetailResponse?> GetSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        return session is null ? null : MapDetail(session);
    }

    public async Task<AiSessionDetailResponse> CreateSessionAsync(
        Guid userId,
        CreateAiSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var session = new AiSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "New AI Session" : request.Title.Trim(),
            ModelUsed = string.IsNullOrWhiteSpace(aiOptions.Value.ApiKey) ? "assetbox-advisor" : aiOptions.Value.Model,
            CreatedAt = now,
            UpdatedAt = now
        };
        aiRepository.AddSession(session);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new AiSessionDetailResponse(session.Id, session.Title, session.IsArchived, []);
    }

    public async Task<AiSessionDetailResponse?> UpdateSessionAsync(
        Guid userId,
        Guid sessionId,
        UpdateAiSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null)
            return null;

        if (request.Title is not null)
            session.Title = string.IsNullOrWhiteSpace(request.Title) ? session.Title : request.Title.Trim();
        if (request.IsArchived.HasValue)
            session.IsArchived = request.IsArchived.Value;
        session.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var reloaded = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken) ?? session;
        return MapDetail(reloaded);
    }

    public async Task<bool> DeleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null)
            return false;

        aiRepository.RemoveSession(session);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> CleanupEmptySessionsAsync(
        Guid userId,
        Guid? keepSessionId,
        CancellationToken cancellationToken = default)
    {
        var deleted = await aiRepository.DeleteEmptySessionsAsync(userId, keepSessionId, cancellationToken);
        if (deleted > 0)
            await unitOfWork.SaveChangesAsync(cancellationToken);
        return deleted;
    }

    public async Task<SendAiMessageResponse?> SendMessageAsync(
        Guid userId,
        Guid sessionId,
        SendAiMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null || session.IsArchived)
            return null;

        var wallet = await walletRepository.GetOrCreateByUserIdForUpdateAsync(userId, cancellationToken);

        var unlimited = await walletRepository.HasUnlimitedPlanAsync(userId, cancellationToken);
        if (!unlimited && wallet.Balance < XuPerMessage)
            throw new InvalidOperationException("Not enough xu to send AI message.");

        var now = DateTime.UtcNow;
        var userMessage = new AiMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = AiMessageRole.User,
            Content = request.Content.Trim(),
            TokenUsed = request.Content.Length / 4,
            XuCharged = 0,
            CreatedAt = now
        };
        aiRepository.AddMessage(userMessage);

        var trimmedContent = request.Content.Trim();
        var historySession = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        var recentUserContents = historySession?.Messages
            .Where(m => m.Role == AiMessageRole.User)
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role)
            .Select(m => m.Content)
            .ToList() ?? [];
        var recentMessages = historySession?.Messages
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role)
            .Select(m => (m.Role.ToString().ToLowerInvariant(), m.Content))
            .ToList() ?? [];

        var suggestAssets = AiReplyHelpers.ShouldSuggestAssets(trimmedContent, recentUserContents);
        var suggestionEntries = suggestAssets
            ? await BuildSuggestionsAsync(trimmedContent, recentUserContents, cancellationToken)
            : [];
        var suggestions = suggestionEntries.Select(e => e.Response).ToList();

        var answer = await llmChatService.GenerateAdvisorReplyAsync(
            request.Content.Trim(),
            recentMessages,
            suggestionEntries.Select(e => (e.Response.Title, e.Category)).ToList(),
            cancellationToken);

        if (!AiReplyHelpers.IsCasualMessage(trimmedContent)
            && session.Title is "New AI Session" or "AssetBox AI Chat" or "Phiên chat mới")
        {
            var title = TruncateTitle(trimmedContent);
            if (!string.IsNullOrWhiteSpace(title))
                session.Title = title;
        }

        if (!unlimited)
        {
            wallet.Balance -= XuPerMessage;
            wallet.UpdatedAt = now;
            unitOfWork.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTxType.AiUsage,
                Amount = -XuPerMessage,
                BalanceAfter = wallet.Balance,
                Description = "AI advisor message",
                ReferenceType = "ai_session",
                ReferenceId = session.Id,
                CreatedAt = now
            });
        }

        var assetSuggestionStatus = suggestAssets
            ? suggestions.Count > 0 ? "found" : "not_found"
            : null;

        var assistantMessage = new AiMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = AiMessageRole.Assistant,
            Content = answer,
            TokenUsed = answer.Length / 4,
            XuCharged = unlimited ? 0 : XuPerMessage,
            Metadata = BuildAssetSuggestionMetadata(assetSuggestionStatus),
            CreatedAt = now.AddMilliseconds(1)
        };
        aiRepository.AddMessage(assistantMessage);

        if (suggestions.Count > 0)
        {
            aiRepository.AddMessageAssets(suggestions.Select((s, idx) => new AiMessageAsset
            {
                MessageId = assistantMessage.Id,
                AssetId = s.AssetId,
                RelevanceScore = s.RelevanceScore,
                SortOrder = (short)idx
            }));
        }

        session.TotalXuUsed += unlimited ? 0 : XuPerMessage;
        session.UpdatedAt = now;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new SendAiMessageResponse(
            ToMessageResponse(userMessage),
            ToMessageResponse(assistantMessage, suggestions, assetSuggestionStatus),
            wallet.Balance,
            unlimited);
    }

    public async Task<AiExportResponse?> ExportSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        if (session is null)
            return null;

        var messages = session.Messages
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role)
            .Select(m => (m.Role.ToString().ToLowerInvariant(), m.Content))
            .ToList();

        var outline = await llmChatService.GenerateSessionOutlineAsync(session.Title, messages, cancellationToken);
        return new AiExportResponse("markdown", outline);
    }

    public async Task<AiOutlineResponse?> GenerateOutlineAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null || session.IsArchived)
            return null;

        var detail = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        if (detail is null)
            return null;

        var messages = detail.Messages
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role)
            .Select(m => (m.Role.ToString().ToLowerInvariant(), m.Content))
            .ToList();

        if (!messages.Any(m => m.Item1 == "user"))
            throw new InvalidOperationException("Cần ít nhất một tin nhắn trong hội thoại để tạo Project Blueprint.");

        var (wallet, unlimited) = await ChargeXuForAiAsync(userId, session, "AI project blueprint", cancellationToken);

        var outline = await llmChatService.GenerateSessionOutlineAsync(session.Title, messages, cancellationToken);
        session.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AiOutlineResponse(outline, wallet.Balance, unlimited);
    }

    public async Task<AiOutlineResponse?> RefineOutlineAsync(
        Guid userId,
        Guid sessionId,
        RefineAiOutlineRequest request,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null || session.IsArchived)
            return null;

        var detail = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        if (detail is null)
            return null;

        var messages = detail.Messages
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role)
            .Select(m => (m.Role.ToString().ToLowerInvariant(), m.Content))
            .ToList();

        var (wallet, unlimited) = await ChargeXuForAiAsync(userId, session, "AI blueprint refine", cancellationToken);

        var refined = await llmChatService.RefineSessionOutlineAsync(
            request.CurrentOutline.Trim(),
            request.Instruction.Trim(),
            messages,
            cancellationToken);

        session.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AiOutlineResponse(refined, wallet.Balance, unlimited);
    }

    private async Task<(Wallet Wallet, bool Unlimited)> ChargeXuForAiAsync(
        Guid userId,
        AiSession session,
        string description,
        CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetOrCreateByUserIdForUpdateAsync(userId, cancellationToken);

        var unlimited = await walletRepository.HasUnlimitedPlanAsync(userId, cancellationToken);
        if (!unlimited && wallet.Balance < XuPerMessage)
            throw new InvalidOperationException("Not enough xu to send AI message.");

        var now = DateTime.UtcNow;
        if (!unlimited)
        {
            wallet.Balance -= XuPerMessage;
            wallet.UpdatedAt = now;
            unitOfWork.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTxType.AiUsage,
                Amount = -XuPerMessage,
                BalanceAfter = wallet.Balance,
                Description = description,
                ReferenceType = "ai_session",
                ReferenceId = session.Id,
                CreatedAt = now
            });
        }

        session.TotalXuUsed += unlimited ? 0 : XuPerMessage;
        session.UpdatedAt = now;
        return (wallet, unlimited);
    }

    private async Task<List<(AiSuggestedAssetResponse Response, string? Category)>> BuildSuggestionsAsync(
        string prompt,
        IReadOnlyList<string> recentUserMessages,
        CancellationToken cancellationToken)
    {
        var terms = AiReplyHelpers.ExtractSearchTerms(prompt, recentUserMessages);
        var seen = new HashSet<Guid>();
        var ranked = new List<(Models.Entities.Asset Asset, int Rank)>();

        foreach (var term in terms)
        {
            if (ranked.Count >= 8)
                break;

            var (items, _) = await assetRepository.ListApprovedAsync(new DTOs.Marketplace.AssetQueryParams
            {
                Search = term,
                Page = 1,
                PageSize = 6
            }, viewerUserId: null, cancellationToken);

            foreach (var asset in items)
            {
                if (seen.Add(asset.Id))
                    ranked.Add((asset, 100 - ranked.Count));
            }
        }

        return ranked
            .Take(4)
            .Select((entry, index) => (
                new AiSuggestedAssetResponse(
                    entry.Asset.Id,
                    entry.Asset.Title,
                    entry.Asset.ThumbnailUrl,
                    Math.Round(0.94m - (index * 0.07m), 2)),
                entry.Asset.Category?.Name))
            .ToList();
    }

    private static string TruncateTitle(string text)
    {
        var oneLine = text.Replace('\n', ' ').Trim();
        return oneLine.Length <= 48 ? oneLine : oneLine[..45] + "...";
    }

    private static AiSessionListItemResponse MapListItem(AiSession s, int messageCount) =>
        new(s.Id, s.Title, s.TotalXuUsed, messageCount, s.IsArchived, s.UpdatedAt);

    private static AiSessionDetailResponse MapDetail(AiSession s) =>
        new(s.Id, s.Title, s.IsArchived, s.Messages.OrderBy(m => m.CreatedAt).ThenBy(m => m.Role).Select(MapMessageFromEntity).ToList());

    private static AiMessageResponse MapMessageFromEntity(AiMessage msg)
    {
        var suggestions = msg.SuggestedAssets?
            .OrderBy(sa => sa.SortOrder)
            .Select(sa => new AiSuggestedAssetResponse(
                sa.AssetId,
                sa.Asset?.Title ?? "Asset",
                sa.Asset?.ThumbnailUrl,
                sa.RelevanceScore))
            .ToList();

        var status = ReadAssetSuggestionStatus(msg);
        if (suggestions is { Count: > 0 })
            status = "found";

        return suggestions is { Count: > 0 }
            ? ToMessageResponse(msg, suggestions, status)
            : ToMessageResponse(msg, null, status);
    }

    private static AiMessageResponse ToMessageResponse(AiMessage msg) =>
        new(msg.Id, msg.Role.ToString().ToLowerInvariant(), msg.Content, msg.XuCharged, msg.CreatedAt, null);

    private static AiMessageResponse ToMessageResponse(
        AiMessage msg,
        IReadOnlyList<AiSuggestedAssetResponse>? suggestions,
        string? assetSuggestionStatus = null) =>
        new(
            msg.Id,
            msg.Role.ToString().ToLowerInvariant(),
            msg.Content,
            msg.XuCharged,
            msg.CreatedAt,
            suggestions,
            assetSuggestionStatus);

    private static string BuildAssetSuggestionMetadata(string? status) =>
        string.IsNullOrWhiteSpace(status)
            ? "{}"
            : JsonSerializer.Serialize(new { assetSuggestionStatus = status });

    private static string? ReadAssetSuggestionStatus(AiMessage msg)
    {
        if (msg.Role != AiMessageRole.Assistant || string.IsNullOrWhiteSpace(msg.Metadata) || msg.Metadata == "{}")
            return null;

        try
        {
            using var doc = JsonDocument.Parse(msg.Metadata);
            if (doc.RootElement.TryGetProperty("assetSuggestionStatus", out var prop))
            {
                var value = prop.GetString();
                return value is "found" or "not_found" ? value : null;
            }
        }
        catch (JsonException)
        {
            // ignore invalid metadata
        }

        return null;
    }
}
