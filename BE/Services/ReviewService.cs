using Exe.DTOs.Marketplace;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Services.IServices;

namespace Exe.Services;

public class ReviewService(
    IReviewRepository reviewRepository,
    IAssetRepository assetRepository,
    IUserAssetRepository userAssetRepository,
    IUnitOfWork unitOfWork) : IReviewService
{
    public async Task<IReadOnlyList<ReviewItemResponse>> ListByAssetAsync(
        Guid assetId,
        Guid? currentUserId,
        CancellationToken cancellationToken = default)
    {
        var reviews = await reviewRepository.ListByAssetAsync(assetId, cancellationToken);
        return reviews.Select(r => MapReview(r, currentUserId)).ToList();
    }

    public async Task<ReviewItemResponse> CreateAsync(
        Guid userId,
        Guid assetId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetApprovedByIdAsync(assetId, cancellationToken)
            ?? throw new ArgumentException("Asset not found.");

        var owned = await userAssetRepository.ExistsAsync(userId, asset.Id, cancellationToken);
        if (!owned && asset.PriceType != Models.PriceType.Free)
            throw new ArgumentException("Only owners can review paid assets.");

        var existing = await reviewRepository.GetByUserAndAssetAsync(userId, assetId, cancellationToken);
        if (existing is not null)
            throw new ArgumentException("You already reviewed this asset.");

        var now = DateTime.UtcNow;
        var review = new AssetReview
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        reviewRepository.Add(review);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await reviewRepository.RecalculateAssetRatingAsync(assetId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var loaded = await reviewRepository.GetByIdAsync(review.Id, cancellationToken) ?? review;
        return MapReview(loaded, userId);
    }

    public async Task<ReviewItemResponse?> UpdateAsync(
        Guid userId,
        Guid reviewId,
        UpdateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var review = await reviewRepository.GetByIdAsync(reviewId, cancellationToken);
        if (review is null || review.UserId != userId)
            return null;

        if (request.Rating.HasValue)
            review.Rating = request.Rating.Value;
        if (request.Comment is not null)
            review.Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();

        review.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await reviewRepository.RecalculateAssetRatingAsync(review.AssetId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var loaded = await reviewRepository.GetByIdAsync(reviewId, cancellationToken) ?? review;
        return MapReview(loaded, userId);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid reviewId, CancellationToken cancellationToken = default)
    {
        var review = await reviewRepository.GetByIdAsync(reviewId, cancellationToken);
        if (review is null || review.UserId != userId)
            return false;

        var assetId = review.AssetId;
        reviewRepository.Remove(review);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await reviewRepository.RecalculateAssetRatingAsync(assetId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ReviewItemResponse MapReview(AssetReview review, Guid? currentUserId) =>
        new(
            review.Id,
            review.AssetId,
            review.User.Name,
            review.Rating,
            review.Comment,
            review.CreatedAt,
            currentUserId.HasValue && review.UserId == currentUserId.Value);
}
