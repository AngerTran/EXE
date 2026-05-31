# BE — Supabase PostgreSQL + REST API

ASP.NET Core Web API kết nối Supabase qua **Entity Framework Core + Npgsql**, map **22 bảng** từ schema Supabase.

## Chạy API

```powershell
cd BE
dotnet run
```

Swagger: http://localhost:5180/swagger (tự mở khi `dotnet run`)

## Cấu hình

Tạo `appsettings.Development.json` (đã gitignore) — copy từ `appsettings.Development.example.json`:

| Key | Nguồn (Supabase Dashboard) |
|-----|----------------------------|
| `ConnectionStrings:DefaultConnection` | Project Settings → Database |
| `Supabase:Url` | Project Settings → API → Project URL |
| `Supabase:AnonKey` | Project Settings → API → Publishable key |
| `Supabase:JwtSecret` | *(Tuỳ chọn)* Legacy HS256 — BE tự verify qua JWKS (ECC) |

## API §4.1 Auth & Profile

Base path: `/api/v1/auth`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/register` | Public | Proxy Supabase signup (tuỳ chọn) |
| POST | `/login` | Public | Proxy Supabase login (tuỳ chọn) |
| GET | `/me` | Bearer JWT | Profile + wallet + subscription |
| PATCH | `/me` | Bearer JWT | Cập nhật `name`, `avatarUrl` |
| POST | `/logout` | Bearer JWT | 204 — client vẫn nên `supabase.auth.signOut()` |

**Header:** `Authorization: Bearer <supabase_access_token>`

**GET /me response:**
```json
{
  "id": "uuid",
  "email": "user@fpt.edu.vn",
  "username": "user",
  "name": "Nguyễn Văn A",
  "role": "customer",
  "avatarUrl": null,
  "wallet": { "balance": 85, "isUnlimited": false },
  "subscription": { "plan": "student", "status": "active", "expiredAt": "..." }
}
```

## Kiến trúc

```
Controller → Service → Repository → DbContext
```

- **Controller**: HTTP, validation, map status code — không truy cập DB.
- **Service**: business logic — không inject `AppDbContext`.
- **Repository**: truy vấn/lưu entity — chỉ lớp này dùng EF Core.

## Cấu trúc

```
BE/
├── Program.cs
├── Exe.csproj
├── Controllers/V1/AuthController.cs
├── Services/AuthService.cs, SupabaseAuthClient.cs
├── Repositories/
│   ├── IUnitOfWork.cs, UnitOfWork.cs
│   ├── Profile/IProfileRepository.cs, ProfileRepository.cs
│   └── DependencyInjection.cs
├── DTOs/Auth/
├── Configuration/SupabaseOptions.cs
├── Extensions/
├── Data/
│   ├── AppDbContext.cs
│   ├── NpgsqlEnumSetup.cs
│   └── DependencyInjection.cs
└── Models/Entities/...
```

## Dùng DbContext trong service khác

```csharp
using Exe.Data;

builder.Services.AddSupabaseDatabase(
    builder.Configuration.GetConnectionString("DefaultConnection")!);
```

```csharp
public class SomeService(AppDbContext db)
{
    public Task<List<Asset>> GetAssets() =>
        db.Assets.Where(a => a.Status == AssetStatus.Approved).ToListAsync();
}
```

## Bảng đã map

| DbSet | Bảng Supabase |
|-------|---------------|
| Profiles | profiles |
| Wallets | wallets |
| WalletTransactions | wallet_transactions |
| SubscriptionPlans | subscription_plans |
| Subscriptions | subscriptions |
| Payments | payments |
| Categories | categories |
| TagGroups | tag_groups |
| Tags | tags |
| Assets | assets |
| AssetFiles | asset_files |
| AssetImages | asset_images |
| AssetTags | asset_tags |
| AssetReviews | asset_reviews |
| Bookmarks | bookmarks |
| CartItems | cart_items |
| Orders | orders |
| OrderItems | order_items |
| UserAssets | user_assets |
| AiSessions | ai_sessions |
| AiMessages | ai_messages |
| AiMessageAssets | ai_message_assets |
| AuditLogs | audit_logs |
