using Exe.Models.Entities;

namespace Exe.Repositories.Ai;

public interface IAiRepository
{
    Task<IReadOnlyList<AiSession>> ListSessionsAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<AiSession?> GetSessionAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);

    Task<AiSession?> GetSessionForUpdateAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);

    void AddSession(AiSession session);

    void RemoveSession(AiSession session);

    void AddMessage(AiMessage message);

    void AddMessageAssets(IEnumerable<AiMessageAsset> items);

    Task<Dictionary<Guid, int>> GetSessionMessageCountsAsync(
        IReadOnlyList<Guid> sessionIds,
        CancellationToken cancellationToken = default);

    Task<int> DeleteEmptySessionsAsync(
        Guid userId,
        Guid? keepSessionId,
        CancellationToken cancellationToken = default);
}
