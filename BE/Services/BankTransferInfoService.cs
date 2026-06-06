using Exe.Configuration;
using Exe.DTOs.Billing;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class BankTransferInfoService(IOptions<BankTransferOptions> options)
{
    private readonly BankTransferOptions _options = options.Value;

    public BankTransferInfoResponse GetInfo(long? amountVnd = null, string? transferMemo = null)
    {
        var vietQrUrl = string.IsNullOrWhiteSpace(_options.QrImageUrl)
            ? BuildVietQrImageUrl(_options.BankBin, _options.AccountNumber, _options.AccountHolder, amountVnd, transferMemo)
            : null;

        return new BankTransferInfoResponse(
            _options.BankBin,
            _options.BankName,
            _options.AccountNumber,
            _options.AccountHolder,
            string.IsNullOrWhiteSpace(_options.QrImageUrl) ? null : _options.QrImageUrl,
            vietQrUrl);
    }

    public static string? BuildVietQrImageUrl(
        string bankBin,
        string accountNumber,
        string accountHolder,
        long? amountVnd,
        string? transferMemo)
    {
        if (string.IsNullOrWhiteSpace(bankBin) || string.IsNullOrWhiteSpace(accountNumber))
            return null;

        var query = new List<string>();
        if (amountVnd is > 0)
            query.Add($"amount={Uri.EscapeDataString(amountVnd.Value.ToString())}");
        if (!string.IsNullOrWhiteSpace(transferMemo))
            query.Add($"addInfo={Uri.EscapeDataString(transferMemo.Trim())}");
        if (!string.IsNullOrWhiteSpace(accountHolder))
            query.Add($"accountName={Uri.EscapeDataString(accountHolder.Trim())}");

        var baseUrl = $"https://img.vietqr.io/image/{bankBin}-{accountNumber}-compact2.jpg";
        return query.Count == 0 ? baseUrl : $"{baseUrl}?{string.Join("&", query)}";
    }
}
