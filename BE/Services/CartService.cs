using Exe.DTOs.Commerce;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Services.IServices;

namespace Exe.Services;

public class CartService(
    ICartRepository cartRepository,
    IAssetRepository assetRepository,
    IUnitOfWork unitOfWork) : ICartService
{
    public async Task<CartResponse> GetCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await cartRepository.GetItemsAsync(userId, cancellationToken);
        return MapCart(items);
    }

    public async Task<CartItemResponse> AddItemAsync(
        Guid userId,
        AddCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetApprovedByIdAsync(request.AssetId, cancellationToken)
            ?? throw new ArgumentException("Asset not found.");

        if (asset.PriceType == PriceType.Free)
            throw new ArgumentException("Free asset does not need cart checkout.");

        var existing = await cartRepository.GetItemByAssetAsync(userId, request.AssetId, cancellationToken);
        if (existing is not null)
        {
            existing.Quantity = request.Quantity;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            var reloaded = await cartRepository.GetItemAsync(userId, existing.Id, cancellationToken) ?? existing;
            return MapItem(reloaded);
        }

        var item = new Models.Entities.CartItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AssetId = request.AssetId,
            Quantity = request.Quantity,
            CreatedAt = DateTime.UtcNow
        };

        cartRepository.Add(item);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await cartRepository.GetItemAsync(userId, item.Id, cancellationToken) ?? item;
        return MapItem(saved);
    }

    public async Task<CartItemResponse?> UpdateItemAsync(
        Guid userId,
        Guid cartItemId,
        UpdateCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var item = await cartRepository.GetItemAsync(userId, cartItemId, cancellationToken);
        if (item is null)
            return null;

        item.Quantity = request.Quantity;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapItem(item);
    }

    public async Task<bool> RemoveItemAsync(Guid userId, Guid cartItemId, CancellationToken cancellationToken = default)
    {
        var item = await cartRepository.GetItemAsync(userId, cartItemId, cancellationToken);
        if (item is null)
            return false;

        cartRepository.Remove(item);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await cartRepository.GetItemsAsync(userId, cancellationToken);
        if (items.Count == 0)
            return;

        cartRepository.RemoveRange(items);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static CartResponse MapCart(IReadOnlyList<Models.Entities.CartItem> items)
    {
        var data = items.Select(MapItem).ToList();
        var subtotal = data.Sum(i => i.LineTotalVnd);
        return new CartResponse(data, subtotal, data.Sum(i => i.Quantity));
    }

    private static CartItemResponse MapItem(Models.Entities.CartItem item)
    {
        var unitPrice = item.Asset.PriceType == PriceType.Free ? 0 : item.Asset.PriceVnd;
        var total = unitPrice * item.Quantity;
        return new CartItemResponse(
            item.Id,
            item.AssetId,
            item.Quantity,
            new CartAssetPreview(
                item.Asset.Id,
                item.Asset.Title,
                item.Asset.ThumbnailUrl,
                item.Asset.Category.Name,
                item.Asset.PriceType.ToString().ToLowerInvariant(),
                item.Asset.PriceVnd,
                item.Asset.PriceType == PriceType.Free),
            total);
    }
}
