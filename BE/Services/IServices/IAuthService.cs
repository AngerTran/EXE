using Exe.DTOs.Auth;

namespace Exe.Services.IServices;

public interface IAuthService
{
    Task<AuthSessionResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthSessionResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<MeResponse?> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<MeResponse?> UpdateMeAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
}
