using Exe.DTOs.Commerce;

namespace Exe.Services.IServices;

public interface ICartService
{
    Task<CartResponse> GetCartAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CartItemResponse> AddItemAsync(Guid userId, AddCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartItemResponse?> UpdateItemAsync(Guid userId, Guid cartItemId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);
    Task<bool> RemoveItemAsync(Guid userId, Guid cartItemId, CancellationToken cancellationToken = default);
    Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default);
}
