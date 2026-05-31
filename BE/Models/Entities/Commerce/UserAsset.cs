namespace Exe.Models.Entities;

public class UserAsset
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AssetId { get; set; }
    public Guid? OrderId { get; set; }
    public string AcquiredVia { get; set; } = "purchase";
    public int DownloadCount { get; set; }
    public DateTime? LastDownloadAt { get; set; }
    public DateTime AcquiredAt { get; set; }

    public Profile User { get; set; } = null!;
    public Asset Asset { get; set; } = null!;
    public Order? Order { get; set; }
}
