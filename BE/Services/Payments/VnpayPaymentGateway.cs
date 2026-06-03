using System.Net;
using System.Security.Cryptography;
using System.Text;
using Exe.Configuration;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.Extensions.Options;

namespace Exe.Services.Payments;

public class VnpayPaymentGateway(IOptions<VnpayOptions> options) : IPaymentGateway
{
    private readonly VnpayOptions _options = options.Value;

    public PaymentMethod Method => PaymentMethod.Vnpay;

    public bool IsAvailable => _options.IsConfigured;

    public Task<GatewayPaymentResult> CreatePaymentAsync(
        Payment payment,
        Order order,
        string ipnUrl,
        string returnUrl,
        CancellationToken cancellationToken = default)
    {
        if (!IsAvailable)
            throw new InvalidOperationException("VNPay is not configured. Set Vnpay:TmnCode, HashSecret in appsettings.");

        var now = DateTime.UtcNow.AddHours(7);
        var expire = now.AddMinutes(15);
        var txnRef = payment.Id.ToString("N");
        var createDate = now.ToString("yyyyMMddHHmmss");
        var expireDate = expire.ToString("yyyyMMddHHmmss");

        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = _options.Version,
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = _options.TmnCode,
            ["vnp_Amount"] = (payment.AmountVnd * 100).ToString(),
            ["vnp_CurrCode"] = _options.Currency,
            ["vnp_TxnRef"] = txnRef,
            ["vnp_OrderInfo"] = $"Thanh toan {order.OrderCode}",
            ["vnp_OrderType"] = "other",
            ["vnp_Locale"] = _options.Locale,
            ["vnp_ReturnUrl"] = returnUrl,
            ["vnp_IpAddr"] = "127.0.0.1",
            ["vnp_CreateDate"] = createDate,
            ["vnp_ExpireDate"] = expireDate
        };

        var signData = string.Join("&", parameters.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));
        var secureHash = SignHmacSha512(signData, _options.HashSecret);
        parameters["vnp_SecureHash"] = secureHash;

        var query = string.Join("&", parameters.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));
        var payUrl = $"{_options.PaymentUrl}?{query}";

        return Task.FromResult(new GatewayPaymentResult(payUrl, txnRef));
    }

    public static bool TryVerifyReturnUrl(IReadOnlyDictionary<string, string> query, string hashSecret, out string txnRef, out bool success)
    {
        txnRef = "";
        success = false;
        if (!query.TryGetValue("vnp_SecureHash", out var secureHash) || string.IsNullOrEmpty(secureHash))
            return false;

        var filtered = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var kv in query)
        {
            if (!kv.Key.StartsWith("vnp_", StringComparison.Ordinal)
                || kv.Key is "vnp_SecureHash" or "vnp_SecureHashType")
                continue;
            filtered[kv.Key] = kv.Value;
        }

        var signData = string.Join("&", filtered.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));
        if (!string.Equals(SignHmacSha512(signData, hashSecret), secureHash, StringComparison.OrdinalIgnoreCase))
            return false;

        txnRef = query.GetValueOrDefault("vnp_TxnRef") ?? "";
        var responseCode = query.GetValueOrDefault("vnp_ResponseCode");
        success = responseCode == "00";
        return true;
    }

    private static string SignHmacSha512(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA512(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }
}
