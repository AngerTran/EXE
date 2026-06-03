namespace Exe.Configuration;

/// <summary>Dev/MVP: tự hoàn tất payment ngay khi tạo order (giống FE mock). Tắt khi tích hợp MoMo/VNPay thật.</summary>
public class PaymentOptions
{
    public const string SectionName = "Payment";

    public bool AutoCompleteOnCreate { get; set; } = true;

    public string? WebhookSecret { get; set; }

    public string PaymentRedirectUrlTemplate { get; set; } = "/checkout?paymentId={0}";

    /// <summary>URL BE public (HTTPS) — dùng build IPN: {base}/api/v1/payments/webhook/momo</summary>
    public string ApiPublicBaseUrl { get; set; } = "";

    /// <summary>Trang FE sau thanh toán (redirectUrl gửi cổng).</summary>
    public string FeReturnUrl { get; set; } = "http://localhost:5173/checkout/return";
}
