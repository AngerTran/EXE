using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Exe.DTOs.Auth;

/// <summary>Body đăng ký tài khoản mới (email, password, name, username tùy chọn).</summary>
public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MaxLength(100)] string Name,
    [MaxLength(50)] string? Username);

/// <summary>Body đăng nhập (email + password).</summary>
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

/// <summary>Session trả về sau register/login. Dùng accessToken cho header Authorization.</summary>
public record AuthSessionResponse(
    string? AccessToken,
    string? RefreshToken,
    int ExpiresIn,
    string TokenType,
    AuthUserResponse User,
    bool RequiresEmailConfirmation = false);

public record AuthUserResponse(
    Guid Id,
    string Email,
    [property: JsonPropertyName("email_confirmed_at")] DateTime? EmailConfirmedAt);

/// <summary>Response GET /auth/me — profile, wallet (xu), subscription cho AuthContext FE.</summary>
public record MeResponse(
    Guid Id,
    string Email,
    string Username,
    string Name,
    string Role,
    string? AvatarUrl,
    MeWalletResponse Wallet,
    MeSubscriptionResponse Subscription);

/// <summary>Số dư ví xu và cờ unlimited plan.</summary>
public record MeWalletResponse(int Balance, bool IsUnlimited);

/// <summary>Gói subscription hiện tại (plan: free|student|indie|pro).</summary>
public record MeSubscriptionResponse(
    string Plan,
    string Status,
    DateTime? ExpiredAt);

/// <summary>Body PATCH /auth/me — ít nhất một field (name hoặc avatarUrl) bắt buộc.</summary>
public record UpdateProfileRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(1_048_576)] string? AvatarUrl);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required, MinLength(6)] string Password,
    [Required] string AccessToken);

public record AvatarUploadUrlRequest(
    [Required, MaxLength(255)] string FileName,
    [Required, MaxLength(128)] string ContentType,
    [Range(1, 10485760)] long FileSizeBytes);

public record ConfirmAvatarRequest(
    [Required, MaxLength(1024)] string StoragePath);

/// <summary>Cấu hình Supabase public cho FE OAuth (PKCE) — anon key an toàn expose qua HTTPS.</summary>
public record SupabasePublicConfigResponse(string Url, string AnonKey);

public record ErrorResponse(string Message, string? Code = null);
