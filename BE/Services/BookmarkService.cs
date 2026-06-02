using Exe.DTOs.Marketplace;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Marketplace;
using Exe.Services.IServices;

namespace Exe.Services;

public class BookmarkService(
    IBookmarkRepository bookmarkRepository,
    IAssetRepository assetRepository,
    IUnitOfWork unitOfWork) : IBookmarkService
{
    public async Task<BookmarkListResponse> ListAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await bookmarkRepository.ListAsync(userId, cancellationToken);
        var data = items.Select(b =>
        {
            var a = b.Asset;
            return new AssetListItemResponse(
                a.Id,
                a.Slug,
                a.Title,
                a.ShortDescription,
                a.CategoryId,
                a.Category.Name,
                a.Uploader.Name,
                a.PriceType.ToString().ToLowerInvariant(),
                a.PriceVnd,
                a.PriceXu,
                a.RatingAvg,
                a.RatingCount,
                a.DownloadCount,
                a.ThumbnailUrl,
                a.AssetTags.Select(at => at.Tag.Name).ToList(),
                a.PriceType == Models.PriceType.Free);
        }).ToList();
        return new BookmarkListResponse(data);
    }

    public async Task AddAsync(Guid userId, CreateBookmarkRequest request, CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetApprovedByIdAsync(request.AssetId, cancellationToken)
            ?? throw new ArgumentException("Asset not found.");

        var existing = await bookmarkRepository.GetAsync(userId, request.AssetId, cancellationToken);
        if (existing is not null)
            return;

        bookmarkRepository.Add(new Bookmark
        {
            UserId = userId,
            AssetId = asset.Id,
            CreatedAt = DateTime.UtcNow
        });
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> RemoveAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default)
    {
        var bookmark = await bookmarkRepository.GetAsync(userId, assetId, cancellationToken);
        if (bookmark is null)
            return false;

        bookmarkRepository.Remove(bookmark);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
