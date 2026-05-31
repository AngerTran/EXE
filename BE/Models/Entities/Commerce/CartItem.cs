namespace Exe.Models.Entities;

public class CartItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AssetId { get; set; }
    public short Quantity { get; set; } = 1;
    public DateTime CreatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public Asset Asset { get; set; } = null!;
}
