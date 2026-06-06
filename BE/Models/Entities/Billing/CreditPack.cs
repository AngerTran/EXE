namespace Exe.Models.Entities;

public class CreditPack
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int Credits { get; set; }
    public long PriceVnd { get; set; }
    public short? DiscountPercent { get; set; }
    public short SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
