namespace Exe.Configuration;

public class AiOptions
{
    public const string SectionName = "Ai";

    /// <summary>OpenAI-compatible API key. Empty = fallback mock advisor.</summary>
    public string ApiKey { get; set; } = "";

    public string Model { get; set; } = "gpt-4o-mini";

    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    /// Max tokens for chat replies.
    public int MaxTokens { get; set; } = 900;

    /// Max tokens for game outline / blueprint (longer structured markdown).
    public int OutlineMaxTokens { get; set; } = 2800;

    public double Temperature { get; set; } = 0.7;
}
