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
            $"storage/v1/object/upload/sign/{bucket}/{Uri.EscapeDataString(objectPath)}");
        req.Headers.Add("apikey", _supabase.ServiceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabase.ServiceRoleKey);
        req.Content = JsonContent.Create(new { expiresIn = expiresInSeconds });

        using var res = await http.SendAsync(req, cancellationToken);
        var payload = await res.Content.ReadAsStringAsync(cancellationToken);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Cannot create upload URL: {payload}");

        using var doc = JsonDocument.Parse(payload);
        var signedPath = doc.RootElement.GetProperty("url").GetString()
            ?? throw new InvalidOperationException("Supabase upload signed URL missing.");
        return $"{_supabase.Url.TrimEnd('/')}/storage/v1{signedPath}";
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
            $"storage/v1/object/sign/{bucket}/{Uri.EscapeDataString(objectPath)}");
        req.Headers.Add("apikey", _supabase.ServiceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabase.ServiceRoleKey);
        req.Content = JsonContent.Create(new { expiresIn = expiresInSeconds });

        using var res = await http.SendAsync(req, cancellationToken);
        var payload = await res.Content.ReadAsStringAsync(cancellationToken);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Cannot create download URL: {payload}");

        using var doc = JsonDocument.Parse(payload);
        var signedPath = doc.RootElement.GetProperty("signedURL").GetString()
            ?? throw new InvalidOperationException("Supabase download signed URL missing.");
        return $"{_supabase.Url.TrimEnd('/')}/storage/v1{signedPath}";
    }

    public string GetPublicObjectUrl(string bucket, string objectPath) =>
        $"{_supabase.Url.TrimEnd('/')}/storage/v1/object/public/{bucket}/{objectPath.TrimStart('/')}";

    private void EnsureServiceRole()
    {
        if (string.IsNullOrWhiteSpace(_supabase.ServiceRoleKey))
            throw new InvalidOperationException("Supabase:ServiceRoleKey is required for storage signed URLs.");
    }
}
