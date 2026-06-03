namespace Exe.Configuration;

public class MomoOptions
{
    public const string SectionName = "Momo";

    public bool Enabled { get; set; }

    public string PartnerCode { get; set; } = "";

    public string AccessKey { get; set; } = "";

    public string SecretKey { get; set; } = "";

    /// <summary>Sandbox: https://test-payment.momo.vn/v2/gateway/api/create</summary>
    public string ApiEndpoint { get; set; } = "https://test-payment.momo.vn/v2/gateway/api/create";

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(PartnerCode)
        && !string.IsNullOrWhiteSpace(AccessKey)
        && !string.IsNullOrWhiteSpace(SecretKey);
}
