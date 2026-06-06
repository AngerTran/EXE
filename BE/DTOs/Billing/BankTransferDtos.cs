namespace Exe.DTOs.Billing;

public record BankTransferInfoResponse(
    string BankBin,
    string BankName,
    string AccountNumber,
    string AccountHolder,
    string? QrImageUrl,
    string? VietQrImageUrl);
