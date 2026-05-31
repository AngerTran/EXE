namespace Exe.Services;

public class AccountBannedException : Exception
{
    public AccountBannedException()
        : base("Account is banned.")
    {
    }
}
