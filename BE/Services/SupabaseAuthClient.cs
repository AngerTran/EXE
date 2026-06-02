using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Exe.Configuration;
using Exe.DTOs.Auth;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class SupabaseAuthClient(HttpClient http, IOptions<SupabaseOptions> options) : ISupabaseAuthClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly SupabaseOptions _options = options.Value;

    public async Task<AuthSessionResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        EnsureAnonKeyConfigured();
        var username = string.IsNullOrWhiteSpace(request.Username) ? request.Email.Split('@')[0] : request.Username.Trim();
        var payload = new { email = request.Email.Trim(), password = request.Password, data = new { name = request.Name.Trim(), username } };
        using var httpRequest = CreateRequest(HttpMethod.Post, "/auth/v1/signup", payload);
        return await SendAuthRequestAsync(httpRequest, true, cancellationToken);
    }

    public async Task<AuthSessionResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        EnsureAnonKeyConfigured();
        var payload = new { email = request.Email.Trim(), password = request.Password };
        using var httpRequest = CreateRequest(HttpMethod.Post, "/auth/v1/token?grant_type=password", payload);
        return await SendAuthRequestAsync(httpRequest, false, cancellationToken);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string path, object body)
    {
        var request = new HttpRequestMessage(method, path) { Content = JsonContent.Create(body, options: JsonOptions) };
        request.Headers.Add("apikey", _options.AnonKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AnonKey);
        return request;
    }

    private async Task<AuthSessionResponse> SendAuthRequestAsync(
        HttpRequestMessage request,
        bool allowEmailConfirmationPending,
        CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new SupabaseAuthException(
                "Cannot reach Supabase Auth. Check Supabase:Url and network connection.",
                StatusCodes.Status503ServiceUnavailable,
                ex);
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryExtractErrorMessage(content) ?? "Authentication request failed.";
            throw new SupabaseAuthException(message, (int)response.StatusCode);
        }

        var session = JsonSerializer.Deserialize<SupabaseSessionPayload>(content, JsonOptions)
            ?? throw new SupabaseAuthException("Invalid response from Supabase Auth.", 502);

        if (!string.IsNullOrWhiteSpace(session.AccessToken))
        {
            return new AuthSessionResponse(
                session.AccessToken,
                session.RefreshToken ?? "",
                session.ExpiresIn ?? 3600,
                session.TokenType ?? "bearer",
                new AuthUserResponse(
                    Guid.Parse(session.User!.Id!),
                    session.User.Email ?? "",
                    session.User.EmailConfirmedAt));
        }

        if (allowEmailConfirmationPending && !string.IsNullOrWhiteSpace(session.Id) && !string.IsNullOrWhiteSpace(session.Email))
        {
            return new AuthSessionResponse(
                null,
                null,
                0,
                "bearer",
                new AuthUserResponse(Guid.Parse(session.Id), session.Email, session.EmailConfirmedAt),
                RequiresEmailConfirmation: true);
        }

        throw new SupabaseAuthException("Supabase did not return an access token.", 502);
    }

    private static string? TryExtractErrorMessage(string content)
    {
        try
        {
            using var doc = JsonDocument.Parse(content);
            if (doc.RootElement.TryGetProperty("msg", out var msg))
                return msg.GetString();
            if (doc.RootElement.TryGetProperty("error_description", out var description))
                return description.GetString();
            if (doc.RootElement.TryGetProperty("message", out var message))
                return message.GetString();
        }
        catch (JsonException)
        {
        }

        return null;
    }

    private void EnsureAnonKeyConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.AnonKey) || _options.AnonKey.StartsWith("YOUR_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Supabase:AnonKey is required for register/login endpoints. Copy anon key from Supabase Dashboard -> Project Settings -> API.");
        }
    }

    private sealed class SupabaseSessionPayload
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }
        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; set; }
        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
        public string? Id { get; set; }
        public string? Email { get; set; }
        [JsonPropertyName("email_confirmed_at")]
        public DateTime? EmailConfirmedAt { get; set; }
        public SupabaseUserPayload? User { get; set; }
    }

    private sealed class SupabaseUserPayload
    {
        public string? Id { get; set; }
        public string? Email { get; set; }
        [JsonPropertyName("email_confirmed_at")]
        public DateTime? EmailConfirmedAt { get; set; }
    }
}

public class SupabaseAuthException(string message, int statusCode, Exception? innerException = null)
    : Exception(message, innerException)
{
    public int StatusCode { get; } = statusCode;
}
