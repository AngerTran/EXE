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

## API §4.2 Subscription Plans

Base path: `/api/v1/subscription-plans`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/` | Public | Danh sách gói (`?activeOnly=true`) |
| GET | `/{id}` | Public | Chi tiết theo UUID |
| GET | `/slug/{slug}` | Public | Chi tiết theo slug: `free`, `student`, `indie`, `pro` |

## API §4.3 Wallet

Base path: `/api/v1/wallets`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/me` | Bearer | Số dư xu + `isUnlimited` (theo gói đang active) |
| GET | `/me/transactions` | Bearer | Lịch sử giao dịch (`?page`, `?pageSize`) |
| PATCH | `/{userId}` | Bearer (admin) | Admin chỉnh balance + ghi `wallet_transactions` (type `bonus`) |

## API §4.4 Categories & Tags

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/v1/categories` | Public | Danh mục asset (filter AddAsset, marketplace) |
| GET | `/api/v1/tags` | Public | Tags (`?groupId=` tuỳ chọn) |
| GET | `/api/v1/tag-groups` | Public | Nhóm tag kèm tags con (map `TAG_GROUPS` FE) |

## API §4.5 Assets (Marketplace)

Base path: `/api/v1/assets`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/` | Public | List `approved`. Query: `search`, `categoryId`, `priceType` (`free`/`paid`), `tag`, `sort`, `order`, `page`, `pageSize` |
| GET | `/pending` | Admin | Chờ duyệt (đặt trước `/{id}` để không conflict route) |
| GET | `/slug/{slug}` | Public | Chi tiết theo slug |
| GET | `/{id}` | Public | Chi tiết + files + images + tags + reviews |
| POST | `/` | Bearer | Tạo asset → `pending_review` |
| PATCH | `/{id}` | Bearer (owner) | Sửa khi `draft` hoặc `pending_review` |
| DELETE | `/{id}` | Bearer (owner) | Soft delete |
| PATCH | `/{id}/approve` | Admin | Duyệt → `approved` |
| PATCH | `/{id}/reject` | Admin | Body: `{ "reason": "..." }` |

## API §4.6 Asset Files & Images (Storage)

Base path: `/api/v1/assets/{assetId}` — chi tiết luồng: [docs/ASSET_STORAGE_4_6.md](../docs/ASSET_STORAGE_4_6.md)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/upload-url` | Bearer (owner) | Signed URL upload zip/ảnh lên Supabase |
| POST | `/files` | Bearer (owner) | Ghi metadata zip sau PUT storage |
| POST | `/images` | Bearer (owner) | Ghi metadata ảnh; `isThumbnail` cập nhật `thumbnail_url` |
| GET | `/download` | Bearer | Signed URL tải zip (free / đã mua / owner / admin) |

**Cấu hình bắt buộc:** `Supabase:ServiceRoleKey` + buckets `asset-files` (private), `asset-images` (public).

## API §4.7–4.14 (Cart, Orders, Payments, …)

Bản đồ đầy đủ + map FE: [docs/BE_APIS_COMPLETE.md](../docs/BE_APIS_COMPLETE.md)

| Module | Base path |
|--------|-----------|
| Cart | `/api/v1/cart` |
| Orders | `/api/v1/orders` |
| Payments | `/api/v1/payments` |
| User assets | `/api/v1/user-assets` |
| Bookmarks | `/api/v1/bookmarks` |
| Reviews | `/api/v1/assets/{id}/reviews`, `/api/v1/reviews` |
| AI | `/api/v1/ai/sessions` |
| Admin | `/api/v1/admin` |
| Subscriptions (user) | `/api/v1/subscriptions` |

**Payment MVP:** `Payment:AutoCompleteOnCreate: true` trong appsettings — đơn hoàn tất ngay sau khi tạo (giống mock FE).

**List response (paged):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "fantasy-character-pack",
      "title": "Fantasy Character Pack",
      "categoryId": "uuid",
      "categoryName": "2D Characters",
      "uploaderName": "ArtStudio",
      "priceType": "paid",
      "priceVnd": 149000,
      "priceXu": 0,
      "ratingAvg": 4.8,
      "ratingCount": 12,
      "downloadCount": 1234,
      "thumbnailUrl": "https://...",
      "tags": ["RPG", "Fantasy"],
      "isFree": false
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

**Map FE (khi tích hợp):** `AssetsMarketplace.tsx` → `GET /assets`; `AddAsset.tsx` → `POST /assets` + lookup `categories`/`tag-groups`; navbar credits → `GET /wallets/me` hoặc `GET /auth/me`.

**Response list example:**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "student",
      "name": "STUDENT",
      "priceVnd": 29000,
      "creditsMonthly": 100,
      "isUnlimited": false,
      "features": ["100 xu/tháng", "..."],
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

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
├── Controllers/V1/          # 18 controllers (auth → admin, cart, orders, …)
├── Services/
│   ├── IServices/           # interfaces (IAuthService, IOrderService, …)
│   ├── *Service.cs            # implementations (flat)
│   ├── OrderFulfillmentService.cs, PaymentMethodParser.cs
│   ├── SupabaseAuthClient.cs, SupabaseJwksProvider.cs, SupabaseStorageService.cs
│   └── ForbiddenException.cs, AccountBannedException.cs
├── Repositories/
│   ├── Admin/, Ai/, Billing/, Commerce/, Marketplace/, Profile/, Wallet/
│   ├── IUnitOfWork.cs, UnitOfWork.cs
│   └── DependencyInjection.cs
├── DTOs/                      # Auth, Admin, Ai, Billing, Commerce, Common, Marketplace, Wallet
├── Configuration/             # SupabaseOptions, StorageOptions, PaymentOptions
├── Extensions/
├── Swagger/
├── Data/
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
