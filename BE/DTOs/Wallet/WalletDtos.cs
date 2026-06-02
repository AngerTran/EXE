namespace Exe.DTOs.Wallet;

public record WalletMeResponse(int Balance, bool IsUnlimited);

public record WalletTransactionResponse(
    Guid Id,
    string Type,
    int Amount,
    int BalanceAfter,
    string? Description,
    string? ReferenceType,
    Guid? ReferenceId,
    DateTime CreatedAt);

public record AdminUpdateWalletBalanceRequest(
    int Balance,
    string? Reason);
