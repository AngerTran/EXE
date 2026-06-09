namespace Exe.Services.IServices;

public interface ILlmChatService
{
    Task<string> GenerateAdvisorReplyAsync(
        string userPrompt,
        IReadOnlyList<(string Role, string Content)> recentMessages,
        IReadOnlyList<(string Title, string? Category)> suggestedAssets,
        CancellationToken cancellationToken = default);
}
