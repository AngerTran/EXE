namespace Exe.Configuration;

public class VnpayOptions
{
    public const string SectionName = "Vnpay";

    public bool Enabled { get; set; }

    public string TmnCode { get; set; } = "";

    public string HashSecret { get; set; } = "";

    public string PaymentUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public string Version { get; set; } = "2.1.0";

    public string Locale { get; set; } = "vn";

    public string Currency { get; set; } = "VND";

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(TmnCode)
        && !string.IsNullOrWhiteSpace(HashSecret);
}
