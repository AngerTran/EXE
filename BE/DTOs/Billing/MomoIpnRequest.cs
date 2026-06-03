using System.Text.Json.Serialization;

namespace Exe.DTOs.Billing;

/// <summary>MoMo IPN callback body (simplified).</summary>
public class MomoIpnRequest
{
    [JsonPropertyName("partnerCode")]
    public string? PartnerCode { get; set; }

    [JsonPropertyName("orderId")]
    public string? OrderId { get; set; }

    [JsonPropertyName("requestId")]
    public string? RequestId { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("resultCode")]
    public int ResultCode { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("signature")]
    public string? Signature { get; set; }
}
