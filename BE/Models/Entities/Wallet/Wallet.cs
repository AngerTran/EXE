namespace Exe.Models.Entities;

public class Wallet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Balance { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = [];
}
