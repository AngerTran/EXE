using Exe.DTOs.Billing;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Profile;
using Exe.Services.IServices;

namespace Exe.Services;

public class CreditPackService(
    ICreditPackRepository creditPackRepository,
    IProfileRepository profileRepository,
    IUnitOfWork unitOfWork) : ICreditPackService
{
    private static readonly (string Id, string Name, int Credits, long PriceVnd, short? Discount, short Sort)[] DefaultPacks =
    [
        ("pack-200", "Gói 200 xu", 200, 29_000, null, 0),
        ("pack-800", "Gói 800 xu", 800, 79_000, 32, 1),
        ("pack-1900", "Gói 1.900 xu", 1_900, 150_000, 45, 2),
    ];

    public async Task<CreditPackListResponse> ListPublicAsync(CancellationToken cancellationToken = default)
    {
        await EnsureSeededAsync(cancellationToken);
        var packs = await creditPackRepository.ListAsync(activeOnly: true, cancellationToken);
        return new CreditPackListResponse(packs.Select(Map).ToList());
    }

    public async Task<CreditPackListResponse> ListAdminAsync(Guid adminUserId, CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        await EnsureSeededAsync(cancellationToken);
        var packs = await creditPackRepository.ListAsync(activeOnly: false, cancellationToken);
        return new CreditPackListResponse(packs.Select(Map).ToList());
    }

    public async Task<CreditPackResponse?> GetForOrderAsync(string packId, CancellationToken cancellationToken = default)
    {
        await EnsureSeededAsync(cancellationToken);
        var pack = await creditPackRepository.GetByIdAsync(packId, activeOnly: true, cancellationToken);
        return pack is null ? null : Map(pack);
    }

    public async Task<CreditPackResponse> CreateAsync(
        Guid adminUserId,
        AdminCreateCreditPackRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        await EnsureSeededAsync(cancellationToken);

        var id = request.Id.Trim().ToLowerInvariant();
        if (await creditPackRepository.GetByIdForUpdateAsync(id, cancellationToken) is not null)
            throw new ArgumentException($"Credit pack '{id}' already exists.");

        var now = DateTime.UtcNow;
        var pack = new CreditPack
        {
            Id = id,
            Name = request.Name.Trim(),
            Credits = request.Credits,
            PriceVnd = request.PriceVnd,
            DiscountPercent = request.DiscountPercent,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };
        creditPackRepository.Add(pack);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(pack);
    }

    public async Task<CreditPackResponse?> UpdateAsync(
        Guid adminUserId,
        string id,
        AdminUpdateCreditPackRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var pack = await creditPackRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (pack is null)
            return null;

        if (request.Name is not null)
            pack.Name = request.Name.Trim();
        if (request.Credits.HasValue)
            pack.Credits = request.Credits.Value;
        if (request.PriceVnd.HasValue)
            pack.PriceVnd = request.PriceVnd.Value;
        if (request.DiscountPercent.HasValue)
            pack.DiscountPercent = request.DiscountPercent;
        if (request.SortOrder.HasValue)
            pack.SortOrder = request.SortOrder.Value;
        if (request.IsActive.HasValue)
            pack.IsActive = request.IsActive.Value;
        pack.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(pack);
    }

    public async Task<bool> DeleteAsync(Guid adminUserId, string id, CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var pack = await creditPackRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (pack is null)
            return false;

        pack.IsActive = false;
        pack.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> HardDeleteAsync(Guid adminUserId, string id, CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var pack = await creditPackRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (pack is null)
            return false;

        creditPackRepository.Remove(pack);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        if (await creditPackRepository.CountAsync(cancellationToken) > 0)
            return;

        var now = DateTime.UtcNow;
        foreach (var d in DefaultPacks)
        {
            creditPackRepository.Add(new CreditPack
            {
                Id = d.Id,
                Name = d.Name,
                Credits = d.Credits,
                PriceVnd = d.PriceVnd,
                DiscountPercent = d.Discount,
                SortOrder = d.Sort,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureAdminAsync(Guid userId, CancellationToken cancellationToken)
    {
        if (await profileRepository.GetRoleAsync(userId, cancellationToken) != UserRole.Admin)
            throw new ForbiddenException("Admin access required.");
    }

    private static CreditPackResponse Map(CreditPack p) =>
        new(p.Id, p.Name, p.Credits, p.PriceVnd, p.DiscountPercent, p.SortOrder, p.IsActive);
}
