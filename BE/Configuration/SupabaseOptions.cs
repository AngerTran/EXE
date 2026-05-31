namespace Exe.Configuration;

public class SupabaseOptions
{
    public const string SectionName = "Supabase";

    public string ProjectRef { get; set; } = "";
    public string Url { get; set; } = "";
    public string AnonKey { get; set; } = "";
    /// <summary>Optional. Legacy HS256 secret — chỉ cần nếu token cũ chưa migrate sang ECC JWKS.</summary>
    public string JwtSecret { get; set; } = "";
}
