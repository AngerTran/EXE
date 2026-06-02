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

    public Task<AiSession?> GetSessionAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default) =>
        db.AiSessions
            .AsNoTracking()
            .Where(s => s.Id == sessionId && s.UserId == userId)
            .Include(s => s.Messages.OrderBy(m => m.CreatedAt))
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
