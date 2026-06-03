using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;

namespace Exe.Services.IServices;

public interface IProfileAvatarService
{
    Task<UploadUrlResponse?> CreateAvatarUploadUrlAsync(
        Guid userId,
        AvatarUploadUrlRequest request,
        CancellationToken cancellationToken = default);

    Task<MeResponse?> ConfirmAvatarAsync(
        Guid userId,
        ConfirmAvatarRequest request,
        CancellationToken cancellationToken = default);
}
