using Exe.Configuration;
using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;
using Exe.Repositories;
using Exe.Repositories.Profile;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class ProfileAvatarService(
    IProfileRepository profileRepository,
    IStorageService storageService,
    IAuthService authService,
    IUnitOfWork unitOfWork,
    IOptions<StorageOptions> storageOptions) : IProfileAvatarService
{
    private readonly StorageOptions _options = storageOptions.Value;

    public async Task<UploadUrlResponse?> CreateAvatarUploadUrlAsync(
        Guid userId,
        AvatarUploadUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetActiveByIdForUpdateAsync(userId, cancellationToken);
        if (profile is null)
            return null;

        if (request.FileSizeBytes <= 0 || request.FileSizeBytes > _options.MaxImageBytes)
            throw new ArgumentException($"Invalid file size. Max allowed is {_options.MaxImageBytes} bytes.");

        var extension = Path.GetExtension(request.FileName);
        var objectPath = $"{userId}/{Guid.NewGuid():N}{extension}";
        var uploadUrl = await storageService.CreateSignedUploadUrlAsync(
            _options.AvatarsBucket,
            objectPath,
            _options.UploadUrlExpiresSeconds,
            cancellationToken);

        return new UploadUrlResponse(
            uploadUrl,
            objectPath,
            _options.AvatarsBucket,
            _options.UploadUrlExpiresSeconds);
    }

    public async Task<MeResponse?> ConfirmAvatarAsync(
        Guid userId,
        ConfirmAvatarRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetActiveByIdForUpdateAsync(userId, cancellationToken);
        if (profile is null)
            return null;

        var path = request.StoragePath.Trim();
        if (!path.StartsWith($"{userId}/", StringComparison.Ordinal))
            throw new ArgumentException("Invalid avatar storage path.");

        profile.AvatarUrl = storageService.GetPublicObjectUrl(_options.AvatarsBucket, path);
        profile.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await authService.GetMeAsync(userId, cancellationToken);
    }
}
