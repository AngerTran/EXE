using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Exe.Configuration;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class SupabaseStorageService(HttpClient http, IOptions<SupabaseOptions> supabaseOptions) : IStorageService
{
    private readonly SupabaseOptions _supabase = supabaseOptions.Value;

    public async Task<string> CreateSignedUploadUrlAsync(
        string bucket,
        string objectPath,
        int expiresInSeconds,
        CancellationToken cancellationToken = default)
    {
        EnsureServiceRole();

        using var req = new HttpRequestMessage(
            HttpMethod.Post,
            BuildObjectEndpoint($"object/upload/sign/{bucket}/{EncodeStorageObjectPath(objectPath)}"));
        AddServiceRoleHeaders(req);
        req.Content = JsonContent.Create(new { expiresIn = expiresInSeconds });

        using var res = await http.SendAsync(req, cancellationToken);
        var payload = await res.Content.ReadAsStringAsync(cancellationToken);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Cannot create upload URL: {payload}");

        using var doc = JsonDocument.Parse(payload);
        var signedPath = ReadSignedPath(doc.RootElement)
            ?? throw new InvalidOperationException("Supabase upload signed URL missing.");
        return ResolveSignedStorageUrl(_supabase.Url, signedPath);
    }

    public async Task<string> CreateSignedDownloadUrlAsync(
        string bucket,
        string objectPath,
        int expiresInSeconds,
        CancellationToken cancellationToken = default)
    {
        EnsureServiceRole();

        using var req = new HttpRequestMessage(
            HttpMethod.Post,
            BuildObjectEndpoint($"object/sign/{bucket}/{EncodeStorageObjectPath(objectPath)}"));
        AddServiceRoleHeaders(req);
        req.Content = JsonContent.Create(new { expiresIn = expiresInSeconds });

        using var res = await http.SendAsync(req, cancellationToken);
        var payload = await res.Content.ReadAsStringAsync(cancellationToken);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Cannot create download URL: {payload}");

        using var doc = JsonDocument.Parse(payload);
        var signedPath = ReadSignedPath(doc.RootElement)
            ?? throw new InvalidOperationException("Supabase download signed URL missing.");
        return ResolveSignedStorageUrl(_supabase.Url, signedPath);
    }

    public async Task<(Stream Content, string ContentType)> OpenObjectAsync(
        string bucket,
        string objectPath,
        CancellationToken cancellationToken = default)
    {
        EnsureServiceRole();

        using var req = new HttpRequestMessage(
            HttpMethod.Get,
            BuildObjectEndpoint($"object/{bucket}/{EncodeStorageObjectPath(objectPath)}"));
        AddServiceRoleHeaders(req);

        using var res = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!res.IsSuccessStatusCode)
        {
            var payload = await res.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Cannot read storage object: {payload}");
        }

        var memory = new MemoryStream();
        await res.Content.CopyToAsync(memory, cancellationToken);
        memory.Position = 0;
        var contentType = res.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        return (memory, contentType);
    }

    public string GetPublicObjectUrl(string bucket, string objectPath) =>
        $"{_supabase.Url.TrimEnd('/')}/storage/v1/object/public/{bucket}/{EncodeStorageObjectPath(objectPath)}";

    private void AddServiceRoleHeaders(HttpRequestMessage req)
    {
        req.Headers.Add("apikey", _supabase.ServiceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabase.ServiceRoleKey);
    }

    private static string BuildObjectEndpoint(string relativePath) =>
        $"storage/v1/{relativePath.TrimStart('/')}";

    private static string EncodeStorageObjectPath(string objectPath) =>
        string.Join('/',
            objectPath.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Uri.EscapeDataString));

    private static string? ReadSignedPath(JsonElement root)
    {
        foreach (var property in root.EnumerateObject())
        {
            if (property.NameEquals("signedURL")
                || property.NameEquals("signedUrl")
                || property.NameEquals("signed_url")
                || property.NameEquals("url"))
            {
                var value = property.Value.GetString();
                if (!string.IsNullOrWhiteSpace(value))
                    return value;
            }
        }

        return null;
    }

    internal static string ResolveSignedStorageUrl(string supabaseUrl, string signedPathOrUrl)
    {
        if (signedPathOrUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || signedPathOrUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return signedPathOrUrl;

        var baseUrl = supabaseUrl.TrimEnd('/');
        var path = signedPathOrUrl.StartsWith('/') ? signedPathOrUrl : $"/{signedPathOrUrl}";

        if (path.StartsWith("/storage/v1/", StringComparison.OrdinalIgnoreCase))
            return $"{baseUrl}{path}";

        return $"{baseUrl}/storage/v1{path}";
    }

    private void EnsureServiceRole()
    {
        if (string.IsNullOrWhiteSpace(_supabase.ServiceRoleKey))
            throw new InvalidOperationException("Supabase:ServiceRoleKey is required for storage signed URLs.");
    }
}
