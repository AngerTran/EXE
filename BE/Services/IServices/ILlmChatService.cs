namespace Exe.Services.IServices;

public interface ILlmChatService
{
    Task<string> GenerateAdvisorReplyAsync(
        string userPrompt,
        IReadOnlyList<(string Role, string Content)> recentMessages,
        IReadOnlyList<(string Title, string? Category)> suggestedAssets,
        CancellationToken cancellationToken = default);

    Task<string> GenerateSessionOutlineAsync(
        string sessionTitle,
        IReadOnlyList<(string Role, string Content)> messages,
        CancellationToken cancellationToken = default);

    Task<string> RefineSessionOutlineAsync(
        string currentOutline,
        string refineInstruction,
        IReadOnlyList<(string Role, string Content)> messages,
        CancellationToken cancellationToken = default);
}
