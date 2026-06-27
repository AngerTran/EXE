namespace Exe.Configuration;

public class SellerOptions
{
    public const string SectionName = "Seller";

    /// <summary>Phần trăm phí platform khi seller bán asset bằng xu (mặc định 30).</summary>
    public int PlatformFeePercent { get; set; } = 30;
}
