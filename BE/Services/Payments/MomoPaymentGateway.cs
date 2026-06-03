using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Exe.Configuration;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.Extensions.Options;

namespace Exe.Services.Payments;

public class MomoPaymentGateway(
    HttpClient http,
    IOptions<MomoOptions> options) : IPaymentGateway
{
    private readonly MomoOptions _options = options.Value;

    public PaymentMethod Method => PaymentMethod.Momo;

    public bool IsAvailable => _options.IsConfigured;

    public async Task<GatewayPaymentResult> CreatePaymentAsync(
        Payment payment,
        Order order,
        string ipnUrl,
        string returnUrl,
        CancellationToken cancellationToken = default)
    {
        if (!IsAvailable)
            throw new InvalidOperationException("MoMo is not configured. Set Momo:PartnerCode, AccessKey, SecretKey in appsettings.");

        var requestId = payment.Id.ToString();
        var orderId = payment.Id.ToString();
        var amount = payment.AmountVnd;
        const string requestType = "captureWallet";
        const string extraData = "";

        var orderInfo = $"Thanh toan {order.OrderCode}";
        var rawSignature =
            $"accessKey={_options.AccessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={_options.PartnerCode}&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";

        var signature = SignHmacSha256(rawSignature, _options.SecretKey);

        var body = new
        {
            partnerCode = _options.PartnerCode,
            accessKey = _options.AccessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl = returnUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang = "vi"
        };

        using var response = await http.PostAsJsonAsync(_options.ApiEndpoint, body, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"MoMo create payment failed: {content}");

        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        var resultCode = root.TryGetProperty("resultCode", out var rc) ? rc.GetInt32() : -1;
        if (resultCode != 0)
        {
            var message = root.TryGetProperty("message", out var m) ? m.GetString() : "Unknown error";
            throw new InvalidOperationException($"MoMo error {resultCode}: {message}");
        }

        var payUrl = root.GetProperty("payUrl").GetString()
            ?? throw new InvalidOperationException("MoMo did not return payUrl.");

        return new GatewayPaymentResult(payUrl, requestId, content);
    }

    public static bool TryVerifyIpnSignature(string rawSignature, string signature, string secretKey) =>
        string.Equals(SignHmacSha256(rawSignature, secretKey), signature, StringComparison.OrdinalIgnoreCase);

    private static string SignHmacSha256(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }
}
