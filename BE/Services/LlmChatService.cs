using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Exe.Configuration;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class LlmChatService(IHttpClientFactory httpClientFactory, IOptions<AiOptions> options) : ILlmChatService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public async Task<string> GenerateAdvisorReplyAsync(
        string userPrompt,
        IReadOnlyList<(string Role, string Content)> recentMessages,
        IReadOnlyList<(string Title, string? Category)> suggestedAssets,
        CancellationToken cancellationToken = default)
    {
        var cfg = options.Value;
        if (string.IsNullOrWhiteSpace(cfg.ApiKey))
            return AiReplyHelpers.IsCasualMessage(userPrompt)
                ? AiReplyHelpers.BuildGreetingReply()
                : AiReplyHelpers.BuildConversationalFallback(userPrompt, suggestedAssets.Count > 0);

        try
        {
            var client = httpClientFactory.CreateClient("LlmChat");
            var baseUrl = cfg.BaseUrl.TrimEnd('/') + "/";
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ApiKey);

            var systemPrompt = AiReplyHelpers.BuildSystemPrompt(userPrompt, suggestedAssets);
            var messages = new List<object> { new { role = "system", content = systemPrompt } };

            foreach (var (role, content) in recentMessages.TakeLast(12))
            {
                var normalizedRole = role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "assistant" : "user";
                messages.Add(new { role = normalizedRole, content });
            }

            messages.Add(new { role = "user", content = userPrompt });

            var body = new
            {
                model = cfg.Model,
                messages,
                max_tokens = cfg.MaxTokens,
                temperature = cfg.Temperature,
            };

            using var response = await client.PostAsync(
                $"{baseUrl}chat/completions",
                new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json"),
                cancellationToken);

            if (!response.IsSuccessStatusCode)
                return AiReplyHelpers.BuildConversationalFallback(userPrompt, suggestedAssets.Count > 0);

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var text = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return string.IsNullOrWhiteSpace(text)
                ? AiReplyHelpers.BuildConversationalFallback(userPrompt, suggestedAssets.Count > 0)
                : text.Trim();
        }
        catch
        {
            return AiReplyHelpers.BuildConversationalFallback(userPrompt, suggestedAssets.Count > 0);
        }
    }
}
