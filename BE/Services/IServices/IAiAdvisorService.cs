using Exe.DTOs.Ai;

namespace Exe.Services.IServices;

public interface IAiAdvisorService
{
    Task<IReadOnlyList<AiSessionListItemResponse>> ListSessionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AiSessionDetailResponse?> GetSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<AiSessionDetailResponse> CreateSessionAsync(Guid userId, CreateAiSessionRequest request, CancellationToken cancellationToken = default);
    Task<AiSessionDetailResponse?> UpdateSessionAsync(Guid userId, Guid sessionId, UpdateAiSessionRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<int> CleanupEmptySessionsAsync(
        Guid userId,
        Guid? keepSessionId,
        CancellationToken cancellationToken = default);
    Task<SendAiMessageResponse?> SendMessageAsync(Guid userId, Guid sessionId, SendAiMessageRequest request, CancellationToken cancellationToken = default);
    Task<AiExportResponse?> ExportSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<AiOutlineResponse?> GenerateOutlineAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<AiOutlineResponse?> RefineOutlineAsync(
        Guid userId,
        Guid sessionId,
        RefineAiOutlineRequest request,
        CancellationToken cancellationToken = default);
}
