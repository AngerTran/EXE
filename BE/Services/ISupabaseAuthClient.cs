using Exe.DTOs.Auth;

namespace Exe.Services;

public interface ISupabaseAuthClient
{
    Task<AuthSessionResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthSessionResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}
