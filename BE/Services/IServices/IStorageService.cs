namespace Exe.Services.IServices;

public interface IStorageService
{
    Task<string> CreateSignedUploadUrlAsync(
        string bucket,
        string objectPath,
        int expiresInSeconds,
        CancellationToken cancellationToken = default);
    Task<string> CreateSignedDownloadUrlAsync(
        string bucket,
        string objectPath,
        int expiresInSeconds,
        CancellationToken cancellationToken = default);
    Task<(Stream Content, string ContentType)> OpenObjectAsync(
        string bucket,
        string objectPath,
        CancellationToken cancellationToken = default);
    string GetPublicObjectUrl(string bucket, string objectPath);
}
