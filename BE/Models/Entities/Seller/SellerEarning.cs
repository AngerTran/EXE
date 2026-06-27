using Exe.Models;

namespace Exe.Models.Entities;

public class SellerEarning
{
    public Guid Id { get; set; }
    public Guid SellerId { get; set; }
    public Guid OrderId { get; set; }
    public Guid AssetId { get; set; }
    public int GrossXu { get; set; }
    public int PlatformFeeXu { get; set; }
    public int NetXu { get; set; }
    public SellerEarningStatus Status { get; set; } = SellerEarningStatus.Pending;
    public DateTime CreatedAt { get; set; }

    public Profile Seller { get; set; } = null!;
    public Order Order { get; set; } = null!;
    public Asset Asset { get; set; } = null!;
}
