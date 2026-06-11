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

    public async Task<string> GenerateSessionOutlineAsync(
        string sessionTitle,
        IReadOnlyList<(string Role, string Content)> messages,
        CancellationToken cancellationToken = default)
    {
        if (messages.Count == 0)
            return AiReplyHelpers.BuildOutlineFallback(sessionTitle, messages);

        var cfg = options.Value;
        if (string.IsNullOrWhiteSpace(cfg.ApiKey))
            return AiReplyHelpers.BuildOutlineFallback(sessionTitle, messages);

        try
        {
            var transcript = new StringBuilder();
            foreach (var (role, content) in messages)
            {
                var label = role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "AI" : "User";
                transcript.AppendLine($"[{label}] {content}");
                transcript.AppendLine();
            }

            var flags = AiReplyHelpers.DetectBlueprintAdaptiveFlags(messages);
            var adaptiveGuide = AiReplyHelpers.BuildBlueprintAdaptiveSectionGuide(flags);

            var userContent = $"""
                Phiên: {sessionTitle}

                Hội thoại:
                {transcript}

                {adaptiveGuide}

                Hãy sinh Project Blueprint đầy đủ theo hướng dẫn system — điền cả phần user chưa hỏi (gameplay loop, MVP, roadmap, asset, rủi ro).
                """;

            return await CompleteWithSystemAsync(
                AiReplyHelpers.BuildOutlineSystemPrompt(),
                userContent,
                cancellationToken)
                ?? AiReplyHelpers.BuildOutlineFallback(sessionTitle, messages);
        }
        catch
        {
            return AiReplyHelpers.BuildOutlineFallback(sessionTitle, messages);
        }
    }

    public async Task<string> RefineSessionOutlineAsync(
        string currentOutline,
        string refineInstruction,
        IReadOnlyList<(string Role, string Content)> messages,
        CancellationToken cancellationToken = default)
    {
        var cfg = options.Value;
        if (string.IsNullOrWhiteSpace(cfg.ApiKey))
        {
            return $"{currentOutline.TrimEnd()}\n\n## Chỉnh sửa theo yêu cầu\n- {refineInstruction.Trim()}";
        }

        try
        {
            var context = messages.Count > 0
                ? string.Join("\n", messages.TakeLast(8).Select(m =>
                    $"[{m.Role}] {m.Content.Replace('\n', ' ')}"))
                : "(không có ngữ cảnh thêm)";

            var userContent = $"""
                Dàn ý hiện tại:
                {currentOutline}

                Yêu cầu chỉnh sửa:
                {refineInstruction}

                Ngữ cảnh hội thoại gần đây:
                {context}
                """;

            return await CompleteWithSystemAsync(
                AiReplyHelpers.BuildRefineOutlineSystemPrompt(),
                userContent,
                cancellationToken)
                ?? currentOutline;
        }
        catch
        {
            return currentOutline;
        }
    }

    private async Task<string?> CompleteWithSystemAsync(
        string systemPrompt,
        string userContent,
        CancellationToken cancellationToken)
    {
        var cfg = options.Value;
        var client = httpClientFactory.CreateClient("LlmChat");
        var baseUrl = cfg.BaseUrl.TrimEnd('/') + "/";
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ApiKey);

        var body = new
        {
            model = cfg.Model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userContent },
            },
            max_tokens = cfg.MaxTokens,
            temperature = Math.Min(cfg.Temperature, 0.5),
        };

        using var response = await client.PostAsync(
            $"{baseUrl}chat/completions",
            new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json"),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
            return null;

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }
}
