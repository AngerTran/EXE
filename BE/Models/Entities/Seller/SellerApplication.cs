using Exe.Models;

namespace Exe.Models.Entities;

public class SellerApplication
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Reason { get; set; } = null!;
    public string? PortfolioUrl { get; set; }
    public SellerApplicationStatus Status { get; set; } = SellerApplicationStatus.Pending;
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public Profile? Reviewer { get; set; }
}
