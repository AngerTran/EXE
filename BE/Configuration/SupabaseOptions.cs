namespace Exe.Configuration;

public class SupabaseOptions
{
    public const string SectionName = "Supabase";

    public string ProjectRef { get; set; } = "";
    public string Url { get; set; } = "";
    public string AnonKey { get; set; } = "";
    /// <summary>Service role — chỉ BE, dùng signed URL Storage (không expose FE).</summary>
    public string ServiceRoleKey { get; set; } = "";
    /// <summary>Optional. Legacy HS256 secret — chỉ cần nếu token cũ chưa migrate sang ECC JWKS.</summary>
    public string JwtSecret { get; set; } = "";
}
