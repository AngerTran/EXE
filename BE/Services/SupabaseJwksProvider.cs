using Microsoft.IdentityModel.Tokens;

namespace Exe.Services;

public class SupabaseJwksProvider(HttpClient http, string jwksUrl)
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private JsonWebKeySet? _cachedSet;
    private DateTime _cachedAt = DateTime.MinValue;

    public async Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(CancellationToken cancellationToken = default)
    {
        await EnsureFreshAsync(cancellationToken);
        return _cachedSet!.GetSigningKeys().ToList();
    }

    private async Task EnsureFreshAsync(CancellationToken cancellationToken)
    {
        if (_cachedSet is not null && DateTime.UtcNow - _cachedAt < CacheDuration)
            return;

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            if (_cachedSet is not null && DateTime.UtcNow - _cachedAt < CacheDuration)
                return;

            var json = await http.GetStringAsync(jwksUrl, cancellationToken);
            _cachedSet = new JsonWebKeySet(json);
            _cachedAt = DateTime.UtcNow;
        }
        finally
        {
            _refreshLock.Release();
        }
    }
}
