namespace Exe.Configuration;

/// <summary>Dev/MVP: tự hoàn tất payment ngay khi tạo order (trừ chuyển khoản). Tắt khi chỉ dùng CK + admin xác nhận.</summary>
public class PaymentOptions
{
    public const string SectionName = "Payment";

    public bool AutoCompleteOnCreate { get; set; } = true;

    public string PaymentRedirectUrlTemplate { get; set; } = "/checkout?paymentId={0}";

    /// <summary>Trang FE sau khi user xác nhận đã chuyển khoản.</summary>
    public string FeReturnUrl { get; set; } = "http://localhost:5173/checkout/return";
}
