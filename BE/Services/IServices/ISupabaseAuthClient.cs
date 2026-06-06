using Exe.DTOs.Auth;

namespace Exe.Services.IServices;

public interface ISupabaseAuthClient
{
    Task<AuthSessionResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthSessionResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}
