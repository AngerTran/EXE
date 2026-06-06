using System.Security.Claims;
using System.Text.Json;

namespace Exe.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue("sub")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : null;
    }

    public static string? GetUserEmail(this ClaimsPrincipal user) =>
        user.FindFirstValue("email")
        ?? user.FindFirstValue(ClaimTypes.Email);

    public static string? GetUserMetadataValue(this ClaimsPrincipal user, string key)
    {
        var raw = user.FindFirstValue("user_metadata");
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
                return value.GetString();
        }
        catch (JsonException)
        {
        }

        return null;
    }
}
