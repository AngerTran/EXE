namespace Exe.Services.IServices;

public record ProfileBootstrapInfo(
    string Email,
    string Name,
    string? Username = null);

public interface IProfileProvisioningService
{
    /// <summary>Tạo profile/wallet/gói free nếu chưa có (fallback khi trigger DB chưa chạy).</summary>
    Task EnsureProfileAsync(
        Guid userId,
        ProfileBootstrapInfo info,
        CancellationToken cancellationToken = default);
}
