using System.Text;
using Exe.DTOs.Ai;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Ai;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Wallet;
using Exe.Services.IServices;

namespace Exe.Services;

public class AiAdvisorService(
    IAiRepository aiRepository,
    IAssetRepository assetRepository,
    IWalletRepository walletRepository,
    IUnitOfWork unitOfWork) : IAiAdvisorService
{
    private const int XuPerMessage = 1;

    public async Task<IReadOnlyList<AiSessionListItemResponse>> ListSessionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await aiRepository.ListSessionsAsync(userId, cancellationToken);
        return sessions.Select(MapListItem).ToList();
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
            ModelUsed = "mock-gpt",
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

    public async Task<SendAiMessageResponse?> SendMessageAsync(
        Guid userId,
        Guid sessionId,
        SendAiMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionForUpdateAsync(sessionId, userId, cancellationToken);
        if (session is null || session.IsArchived)
            return null;

        var wallet = await walletRepository.GetByUserIdForUpdateAsync(userId, cancellationToken);
        if (wallet is null)
            throw new InvalidOperationException("Wallet not found.");

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

        var suggestions = await BuildSuggestionsAsync(request.Content, cancellationToken);
        var answer = BuildMockAnswer(request.Content, suggestions.Select(s => s.Title).ToList());

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

        var assistantMessage = new AiMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = AiMessageRole.Assistant,
            Content = answer,
            TokenUsed = answer.Length / 4,
            XuCharged = unlimited ? 0 : XuPerMessage,
            CreatedAt = now
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
            ToMessageResponse(assistantMessage, suggestions),
            wallet.Balance,
            unlimited);
    }

    public async Task<AiExportResponse?> ExportSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await aiRepository.GetSessionAsync(sessionId, userId, cancellationToken);
        if (session is null)
            return null;

        var sb = new StringBuilder();
        sb.AppendLine($"# {session.Title}");
        sb.AppendLine();
        foreach (var msg in session.Messages.OrderBy(m => m.CreatedAt))
        {
            sb.AppendLine($"## {msg.Role.ToString().ToUpperInvariant()}");
            sb.AppendLine(msg.Content);
            sb.AppendLine();
        }
        return new AiExportResponse("markdown", sb.ToString().TrimEnd());
    }

    private async Task<List<AiSuggestedAssetResponse>> BuildSuggestionsAsync(string prompt, CancellationToken cancellationToken)
    {
        var query = new DTOs.Marketplace.AssetQueryParams
        {
            Search = prompt,
            Page = 1,
            PageSize = 3
        };
        var (items, _) = await assetRepository.ListApprovedAsync(query, cancellationToken);
        return items.Take(3).Select((a, index) => new AiSuggestedAssetResponse(
            a.Id,
            a.Title,
            a.ThumbnailUrl,
            Math.Round(0.95m - (index * 0.1m), 2))).ToList();
    }

    private static string BuildMockAnswer(string prompt, IReadOnlyList<string> suggestedTitles)
    {
        if (suggestedTitles.Count == 0)
            return $"Mock AI: Based on '{prompt}', start with low-poly assets, optimize texture size, and test in your target engine.";
        return $"Mock AI: For '{prompt}', consider these assets: {string.Join(", ", suggestedTitles)}. They align with your request and are good starting points.";
    }

    private static AiSessionListItemResponse MapListItem(AiSession s) =>
        new(s.Id, s.Title, s.TotalXuUsed, s.IsArchived, s.UpdatedAt);

    private static AiSessionDetailResponse MapDetail(AiSession s) =>
        new(s.Id, s.Title, s.IsArchived, s.Messages.Select(ToMessageResponse).ToList());

    private static AiMessageResponse ToMessageResponse(AiMessage msg) =>
        new(msg.Id, msg.Role.ToString().ToLowerInvariant(), msg.Content, msg.XuCharged, msg.CreatedAt, null);

    private static AiMessageResponse ToMessageResponse(AiMessage msg, IReadOnlyList<AiSuggestedAssetResponse> suggestions) =>
        new(msg.Id, msg.Role.ToString().ToLowerInvariant(), msg.Content, msg.XuCharged, msg.CreatedAt, suggestions);
}
