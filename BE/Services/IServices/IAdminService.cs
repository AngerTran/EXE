using Exe.DTOs.Admin;
using Exe.DTOs.Common;
using Exe.Models;

namespace Exe.Services.IServices;

public interface IAdminService
{
    Task<AdminOverviewResponse> GetOverviewAsync(Guid adminUserId, CancellationToken cancellationToken = default);
    Task<PagedResponse<AdminUserResponse>> ListUsersAsync(
        Guid adminUserId,
        string? search,
        UserRole? role,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<AdminUserResponse?> UpdateUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default);
}
