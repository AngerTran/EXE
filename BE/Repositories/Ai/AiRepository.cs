using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Ai;

public class AiRepository(AppDbContext db) : IAiRepository
{
    public async Task<IReadOnlyList<AiSession>> ListSessionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.AiSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && !s.IsArchived)
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<Guid, int>> GetSessionMessageCountsAsync(
        IReadOnlyList<Guid> sessionIds,
        CancellationToken cancellationToken = default)
    {
        if (sessionIds.Count == 0)
            return new Dictionary<Guid, int>();

        return await db.AiMessages
            .AsNoTracking()
            .Where(m => sessionIds.Contains(m.SessionId))
            .GroupBy(m => m.SessionId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);
    }

    public async Task<int> DeleteEmptySessionsAsync(
        Guid userId,
        Guid? keepSessionId,
        CancellationToken cancellationToken = default)
    {
        var query = db.AiSessions
            .Where(s => s.UserId == userId && !s.IsArchived && !s.Messages.Any());
        if (keepSessionId.HasValue)
            query = query.Where(s => s.Id != keepSessionId.Value);

        var toDelete = await query.ToListAsync(cancellationToken);
        if (toDelete.Count == 0)
            return 0;

        db.AiSessions.RemoveRange(toDelete);
        return toDelete.Count;
    }

    public Task<AiSession?> GetSessionAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default) =>
        db.AiSessions
            .AsNoTracking()
            .Where(s => s.Id == sessionId && s.UserId == userId)
            .Include(s => s.Messages.OrderBy(m => m.CreatedAt).ThenBy(m => m.Role))
                .ThenInclude(m => m.SuggestedAssets)
                .ThenInclude(sa => sa.Asset)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<AiSession?> GetSessionForUpdateAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.AiSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

    public void AddSession(AiSession session) => db.AiSessions.Add(session);

    public void RemoveSession(AiSession session) => db.AiSessions.Remove(session);

    public void AddMessage(AiMessage message) => db.AiMessages.Add(message);

    public void AddMessageAssets(IEnumerable<AiMessageAsset> items) => db.AiMessageAssets.AddRange(items);
}
