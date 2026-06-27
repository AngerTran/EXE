# Plan: Role Seller (Creator Economy kiểu itch.io)

Tài liệu kế hoạch thêm **role `seller`** cho AssetBox — hướng tới mô hình creator/seller giống [itch.io](https://itch.io/game-assets) nhưng **giữ USP** (AI, xu, thị trường VN).

**Đọc kèm:** [ITCH_IO_VS_ASSETBOX.md](./ITCH_IO_VS_ASSETBOX.md) — gap analysis hiện tại.

**Cập nhật:** 2026-06  
**Trạng thái:** Plan — chưa implement

---

## Mục lục

1. [Mục tiêu & định vị](#1-mục-tiêu--định-vị)
2. [Hiện trạng codebase](#2-hiện-trạng-codebase)
3. [Seller khác gì Customer / Admin](#3-seller-khác-gì-customer--admin)
4. [Quyết định sản phẩm (cần chốt trước khi code)](#4-quyết-định-sản-phẩm-cần-chốt-trước-khi-code)
5. [Kiến trúc đề xuất](#5-kiến-trúc-đề-xuất)
6. [Database & migration](#6-database--migration)
7. [Backend (BE)](#7-backend-be)
8. [Frontend Web (FE)](#8-frontend-web-fe)
9. [Flutter Mobile](#9-flutter-mobile)
10. [Admin & vận hành](#10-admin--vận-hành)
11. [Bảo mật & RLS](#11-bảo-mật--rls)
12. [Roadmap theo phase](#12-roadmap-theo-phase)
13. [Checklist file cần sửa](#13-checklist-file-cần-sửa)
14. [Rủi ro & phạm vi không làm (giai đoạn 1)](#14-rủi-ro--phạm-vi-không-làm-giai-đoạn-1)

---

## 1. Mục tiêu & định vị

### itch.io seller làm gì?

| Khả năng | itch.io |
|----------|---------|
| Đăng ký / có trang creator | ✅ |
| Upload & tự publish (hoặc mod nhẹ) | ✅ |
| Tự định giá (free / fixed / PWYW) | ✅ |
| Nhận tiền (Stripe/PayPal payout) | ✅ |
| Storefront + analytics | ✅ |
| Buyer mua trực tiếp bằng tiền thật | ✅ |

### AssetBox sau khi có Seller (mục tiêu)

| Giai đoạn | Mục tiêu |
|-----------|----------|
| **Phase 1** | Role `seller` + **Seller Hub** (upload, asset của tôi, trạng thái duyệt) — tách khỏi Admin |
| **Phase 2** | **Storefront** công khai `/creator/:username`, link từ marketplace |
| **Phase 3** | **Seller economy** — chia doanh thu xu khi buyer mua asset |
| **Phase 4** | Payout VND, trusted auto-publish, analytics nâng cao (gần itch.io hơn) |

**Không bỏ:** AI advisor, subscription sinh viên, admin moderation (có thể nới cho seller tin cậy).

---

## 2. Hiện trạng codebase

### Role hiện tại

```csharp
// BE/Models/Enums.cs
public enum UserRole {
    Customer,
    Admin
}
```

- Đăng ký mới → `customer` (`docs/sql/handle_new_user.sql`)
- FE map role: chỉ `admin` | `customer` (`FE/.../api/auth.ts`)
- Flutter: `isAdmin` only (`Flutter/lib/models/auth_models.dart`)

### Upload asset — đã có nền tảng

| Đã có | File / API |
|-------|------------|
| Upload form đầy đủ | `FE/.../AddAsset.tsx` |
| `POST /api/v1/assets` | `AssetsController` → `AssetService.CreateAsync` |
| `GET /api/v1/assets/me` | List asset user đã upload — **FE chưa có UI** |
| `uploader_id` trên asset | `Asset.UploaderId` |
| Duyệt asset | Admin `approve` / `reject` — `AssetService.ApproveAsync` |
| Admin upload → auto approve | FE gọi `approveAsset` sau create nếu `user.role === admin` |

### Chưa có (so itch.io)

- Role seller riêng
- Seller dashboard / “Asset của tôi”
- Trang creator công khai
- Seller nhận xu / VND khi asset bán
- Bảng `seller_profiles`, `seller_earnings`, payout
- Đăng ký làm seller (application flow)
- Auto-publish cho seller tin cậy

### Mô hình tiền hiện tại

- Buyer trả **xu** → trừ ví buyer (`OrderService` asset order)
- `OrderFulfillmentService` chỉ tạo `user_assets` — **không chia cho uploader**
- Platform giữ toàn bộ “giá trị” xu (chưa có seller wallet)

---

## 3. Seller khác gì Customer / Admin

| | **Customer** | **Seller** | **Admin** |
|--|--------------|------------|-----------|
| Mua asset / dùng AI | ✅ | ✅ (vẫn là user) | ✅ |
| Upload asset | ❌* | ✅ | ✅ |
| Xem Seller Hub | ❌ | ✅ | ✅ (xem tất cả) |
| Duyệt asset người khác | ❌ | ❌ | ✅ |
| Auto-approve asset của mình | ❌ | ⚙️ Phase 4 (trusted) | ✅ (hiện tại) |
| Admin dashboard | ❌ | ❌ | ✅ |
| Storefront công khai | ❌ | ✅ Phase 2 | — |

\* Hiện tại **customer vẫn vào được `/add-asset`** nếu biết URL — chưa chặn theo role. Plan: **chỉ `seller` + `admin`** được upload.

**Quyền kế thừa:** `seller` ⊃ `customer` (seller vẫn mua, bookmark, AI). Không cần role `customer+seller` tách rời.

---

## 4. Quyết định sản phẩm (cần chốt trước khi code)

### 4.1 Ai được làm seller?

| Phương án | Ưu | Nhược | Đề xuất |
|-----------|-----|-------|---------|
| **A. Admin cấp role** | Kiểm soát chất lượng | Chậm scale | ✅ **Phase 1** |
| **B. User đăng ký → admin duyệt** | Giống itch “request creator” | Cần form + queue | ✅ **Phase 2** |
| **C. Ai cũng upload (như itch mở)** | Scale nhanh | Loạn catalog | ❌ trừ khi bỏ moderation |

### 4.2 Duyệt asset sau khi có seller

| Phương án | Mô tả |
|-----------|--------|
| **Giữ admin duyệt mọi asset** | An toàn — **đề xuất Phase 1–2** |
| **Seller mới: luôn pending** | Default |
| **Seller trusted: auto-approve** | Sau N asset OK → flag `is_trusted_seller` |

### 4.3 Seller kiếm tiền thế nào?

| Phương án | Mô tả | Phase |
|-----------|--------|-------|
| **Chia xu** | Buyer trả 100 xu → seller nhận 70 xu, platform 30 xu | **Phase 3** |
| **Payout VND** | Seller rút VND (CK/MoMo) — cần KYC, thuế | **Phase 4** |
| **Chỉ danh tiếng** | Không trả tiền, chỉ storefront + download count | Phase 1 tạm |

**Đề xuất:** Phase 1–2 **chưa chia tiền** — tập trung hub + storefront. Phase 3 **chia xu** (đơn giản, khớp hệ thống hiện tại).

### 4.4 Giá asset seller đặt

| | Hiện tại | Seller plan |
|--|----------|-------------|
| Free | ✅ | ✅ |
| Paid (xu) | ✅ min 1 xu | ✅ seller chọn `price_xu` |
| VND trực tiếp | ❌ | Phase 4 |
| PWYW | ❌ | Phase 4 (optional) |

---

## 5. Kiến trúc đề xuất

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Customer   │     │   Seller     │     │     Admin       │
│  browse/buy │     │  Seller Hub  │     │  Admin Dashboard│
│  AI/chat    │     │  upload/edit │     │  duyệt seller   │
└──────┬──────┘     │  storefront  │     │  duyệt asset    │
       │            └──────┬───────┘     └────────┬────────┘
       │                   │                      │
       └───────────────────┼──────────────────────┘
                           ▼
              ┌────────────────────────┐
              │   BE API /api/v1       │
              │   assets, orders, auth │
              └────────────┬───────────┘
                           ▼
              ┌────────────────────────┐
              │  PostgreSQL (Supabase) │
              │  profiles.role=seller  │
              │  assets.uploader_id    │
              │  seller_profiles (mới) │
              │  seller_earnings (P3)  │
              └────────────────────────┘
```

---

## 6. Database & migration

### 6.1 Thêm enum `seller` vào `user_role`

**File SQL mới:** `docs/sql/add_seller_role.sql`

```sql
-- PostgreSQL: thêm giá trị enum (không xóa customer/admin)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';
```

**Lưu ý:** Sau `ALTER TYPE`, cần **reconnect** pool / restart BE (Npgsql cache enum).

**BE:** `BE/Models/Enums.cs`

```csharp
public enum UserRole
{
    [PgName("customer")] Customer,
    [PgName("seller")] Seller,   // NEW
    [PgName("admin")] Admin
}
```

Cập nhật: `NpgsqlEnumSetup.cs`, `DependencyInjection.cs` (đã map `user_role`).

### 6.2 Bảng `seller_profiles` (Phase 2, có thể chuẩn bị sớm)

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| `user_id` | uuid PK, FK → profiles | 1 seller = 1 profile |
| `display_name` | varchar | Tên hiển thị storefront |
| `bio` | text | Giới thiệu |
| `avatar_url` | text | Optional override |
| `website_url` | text | Link portfolio |
| `is_trusted` | boolean | Auto-approve asset (Phase 4) |
| `status` | enum | `pending`, `active`, `suspended` |
| `applied_at` | timestamptz | Khi đăng ký seller |
| `approved_at` | timestamptz | Admin duyệt seller |
| `created_at` | timestamptz | |

### 6.3 Bảng `seller_earnings` (Phase 3)

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| `id` | uuid | |
| `seller_id` | uuid | FK profiles |
| `order_id` | uuid | FK orders |
| `asset_id` | uuid | |
| `gross_xu` | int | Giá asset |
| `platform_fee_xu` | int | Phí platform |
| `net_xu` | int | Seller nhận |
| `status` | enum | `pending`, `available`, `paid_out` |
| `created_at` | timestamptz | |

### 6.4 Bảng `seller_applications` (Phase 2 — optional)

Đăng ký làm seller: lý do, portfolio link, trạng thái duyệt.

### 6.5 Không đổi

- `assets.uploader_id` — đủ để biết ai bán
- `orders` / `order_items` — thêm logic chia xu ở service layer Phase 3

---

## 7. Backend (BE)

### 7.1 Authorization — policy mới

Tạo helper (ví dụ `RoleAuthorization.cs`):

| Policy | Cho phép |
|--------|----------|
| `IsSellerOrAdmin` | `seller`, `admin` |
| `IsAdmin` | `admin` only |

**Áp dụng:**

| Endpoint | Hiện tại | Sau |
|----------|----------|-----|
| `POST /assets` | Mọi user login | **`seller` + `admin`** |
| `PATCH /assets/{id}` (owner) | Uploader | Giữ — seller sửa asset mình |
| `GET /assets/me` | Mọi user login | **`seller` + `admin`** (hoặc customer thấy rỗng) |
| `POST /assets/{id}/approve` | Admin | Admin only |

**File sửa:** `AssetsController.cs`, `AssetService.cs`, `AssetStorageService.cs`

### 7.2 API mới — Seller module

**Base:** `/api/v1/seller` — tag `4.x Seller`

| Method | Path | Mô tả | Phase |
|--------|------|--------|-------|
| `GET` | `/seller/me` | Profile seller + stats tóm tắt | 1 |
| `GET` | `/seller/assets` | Alias hoặc wrap `GET /assets/me` | 1 |
| `GET` | `/seller/stats` | Tổng upload, download, doanh thu xu | 2–3 |
| `PATCH` | `/seller/profile` | Sửa bio, display name | 2 |
| `POST` | `/seller/apply` | Đăng ký làm seller | 2 |
| `GET` | `/seller/earnings` | Lịch sử thu nhập xu | 3 |

### 7.3 API public — Storefront

| Method | Path | Mô tả | Phase |
|--------|------|--------|-------|
| `GET` | `/creators/{username}` | Public seller profile | 2 |
| `GET` | `/creators/{username}/assets` | Asset approved của seller | 2 |

Hoặc query: `GET /assets?sellerId=` / `uploaderId=` (đã có filter `ownerId` trong repo — kiểm tra `AssetRepository`).

### 7.4 Order fulfillment — chia xu (Phase 3)

**File:** `OrderFulfillmentService.FulfillAssetOrderAsync`

Sau khi buyer mua:

1. Trừ xu buyer (đã có)
2. Tạo `user_assets` (đã có)
3. **Mới:** `creditSellerWallet(uploaderId, netXu)` + ghi `seller_earnings`
4. Platform fee config: `SellerOptions.PlatformFeePercent` (default 30%)

**Wallet seller:** Dùng chung bảng `wallets` + `wallet_transactions` type mới `seller_sale` — không cần ví riêng.

### 7.5 DTO / Auth

| File | Thay đổi |
|------|----------|
| `AuthService` / `MeResponse` | Trả `role: "seller"` |
| `AdminUpdateUserRequest` | Admin đổi role → `seller` |
| `AdminDtos` | Filter user theo role seller |

### 7.6 Enum mới (Phase 3)

```csharp
// wallet_tx_type
SellerSale,
SellerPayout,
```

---

## 8. Frontend Web (FE)

### 8.1 Types & auth

| File | Thay đổi |
|------|----------|
| `api/auth.ts` | `UserRole = "customer" \| "seller" \| "admin"` |
| `AuthContext.tsx` | `isSeller()`, redirect sau login |
| `utils/helpers.ts` | `getRoleDisplayText` → "Người bán" |

### 8.2 Routes mới

| Route | Component | Quyền |
|-------|-----------|--------|
| `/seller` | `SellerDashboard.tsx` | seller, admin |
| `/seller/assets` | `SellerAssetsList.tsx` | seller, admin |
| `/seller/upload` | Di chuyển / wrap `AddAsset.tsx` | seller, admin |
| `/seller/apply` | `SellerApply.tsx` | customer (đăng ký) | Phase 2 |
| `/creator/:username` | `CreatorStorefront.tsx` | public | Phase 2 |

**Sửa `routes.ts`**, `tokens.ts` (`hiddenRoutePrefixes`).

### 8.3 Seller Dashboard (Phase 1 — UI tối thiểu)

- Card: tổng asset, pending, approved, tổng download
- Bảng asset (`GET /assets/me`): title, status, price, downloads, actions (sửa / xóa)
- CTA "Upload asset mới"
- **Không** link back về `/admin` trong `AddAsset.tsx`

### 8.4 Marketplace

| Thay đổi | Phase |
|----------|-------|
| Tên author → link `/creator/:username` | 2 |
| Filter "Theo seller" | 3 |
| Badge "Seller" trên card | 2 |

### 8.5 Navigation

- User `seller`: thêm menu **"Seller Hub"** / **"Bán hàng"** trên header hoặc profile dropdown
- User `customer`: nút **"Trở thành người bán"** → `/seller/apply` (Phase 2)

### 8.6 Admin

| Thay đổi |
|----------|
| Tab Users: đổi role → Seller |
| Tab mới **Seller applications** (Phase 2) |
| Assets pending: hiển thị `uploader` + link creator |

---

## 9. Flutter Mobile

| Phase | Việc làm |
|-------|----------|
| 1 | `auth_models.dart`: `isSeller`; ẩn upload nếu không phải seller |
| 2 | Màn `SellerAssetsScreen` (list `GET /assets/me`) |
| 3 | Storefront creator (WebView hoặc native) |
| 4 | Upload asset trên mobile (backlog — `FLUTTER_BACKLOG.md` đã ghi) |

**Ưu tiên:** Web seller hub trước, Flutter sau.

---

## 10. Admin & vận hành

### Cấp quyền seller thủ công (Phase 1)

1. Admin → Users → chọn user → Role = **seller**
2. Hoặc SQL:

```sql
UPDATE public.profiles
SET role = 'seller', updated_at = now()
WHERE email = 'seller@example.com';
```

### Quy trình vận hành đề xuất

```
Customer → (admin cấp seller) → Seller upload → Pending
    → Admin approve asset → Approved trên marketplace
    → Buyer mua bằng xu → (Phase 3) Seller nhận xu
```

### Email / thông báo

- `notifications.category = seller` (có thể thêm enum) — asset approved/rejected, có đơn mua mới

---

## 11. Bảo mật & RLS

Supabase RLS hiện có trên nhiều bảng. Khi thêm seller:

| Bảng | Rule gợi ý |
|------|------------|
| `assets` | Seller `UPDATE` chỉ row `uploader_id = auth.uid()` và status `draft`/`pending_review` |
| `seller_profiles` | Seller đọc/sửa row của mình; public đọc `status = active` |
| `seller_earnings` | Chỉ seller xem của mình |

**BE vẫn là nguồn chính** (JWT + service check) — RLS là lớp phụ cho Supabase direct access.

---

## 12. Roadmap theo phase

### Phase 1 — Role + Seller Hub (2–3 tuần)

**Mục tiêu:** Seller là role thật; có hub riêng; customer không upload nhầm.

| # | Task | Effort |
|---|------|--------|
| 1 | SQL `ALTER TYPE user_role ADD seller` | S |
| 2 | BE enum + `IsSellerOrAdmin` policy | S |
| 3 | Chặn `POST /assets` nếu không seller/admin | S |
| 4 | Admin UI: đổi role seller | S |
| 5 | FE: `SellerDashboard` + `GET /assets/me` | M |
| 6 | Di chuyển `/add-asset` → `/seller/upload`, bỏ link admin | S |
| 7 | Auth types seller trên FE + Flutter đọc role | S |
| 8 | Docs + test E2E: admin cấp seller → upload → admin duyệt | S |

**Deliverable:** Seller có trang quản lý asset; flow giống itch **phần upload**, chưa có tiền.

---

### Phase 2 — Storefront + đăng ký seller (2–3 tuần)

| # | Task | Effort |
|---|------|--------|
| 1 | Bảng `seller_profiles` + migration | M |
| 2 | `GET /creators/{username}` + assets | M |
| 3 | FE `/creator/:username` public page | M |
| 4 | Marketplace: link tác giả → creator page | S |
| 5 | `POST /seller/apply` + admin duyệt application | M |
| 6 | FE `/seller/apply` cho customer | M |
| 7 | Seller stats cơ bản (downloads, asset count) | M |

**Deliverable:** Giống itch **trang creator** cơ bản.

---

### Phase 3 — Seller economy (xu) (3–4 tuần)

| # | Task | Effort |
|---|------|--------|
| 1 | `SellerOptions` — `PlatformFeePercent` | S |
| 2 | `seller_earnings` table | M |
| 3 | Sửa `OrderFulfillmentService` — credit seller wallet | M |
| 4 | `GET /seller/earnings` + dashboard chart | M |
| 5 | FE Seller Hub: doanh thu xu, lịch sử | M |
| 6 | Admin: báo cáo platform fee | M |
| 7 | Test: mua asset → seller balance tăng | S |

**Deliverable:** Seller kiếm **xu** khi bán — chưa rút VND.

---

### Phase 4 — Gần itch.io hơn (tùy chọn, 4+ tuần)

- Trusted seller auto-approve
- Payout VND (MoMo/CK) + KYC đơn giản
- PWYW / sale campaign
- Follow creator
- Analytics nâng cao (views, conversion)
- SEO slug asset + creator (xem `ITCH_IO_VS_ASSETBOX.md` Phase 1)

---

## 13. Checklist file cần sửa

### Database

- [ ] `docs/sql/add_seller_role.sql` (mới)
- [ ] `docs/sql/add_seller_profiles.sql` (Phase 2)
- [ ] `docs/sql/add_seller_earnings.sql` (Phase 3)

### Backend

- [ ] `BE/Models/Enums.cs` — `UserRole.Seller`
- [ ] `BE/Data/NpgsqlEnumSetup.cs`
- [ ] `BE/Extensions/` — `IsSeller`, `IsSellerOrAdmin` claims helper
- [ ] `BE/Controllers/V1/AssetsController.cs` — authorize upload
- [ ] `BE/Services/AssetService.cs`
- [ ] `BE/Services/AssetStorageService.cs`
- [ ] `BE/Controllers/V1/SellerController.cs` (mới)
- [ ] `BE/Services/SellerService.cs` (mới)
- [ ] `BE/Configuration/SellerOptions.cs` (Phase 3)
- [ ] `BE/Services/OrderFulfillmentService.cs` (Phase 3)
- [ ] `BE/DTOs/Auth/*` — MeResponse role
- [ ] `BE/DTOs/Admin/AdminDtos.cs` — role filter

### Frontend

- [ ] `FE/.../api/auth.ts`, `types/*`
- [ ] `FE/.../routes.ts`
- [ ] `FE/.../components/SellerDashboard.tsx` (mới)
- [ ] `FE/.../components/SellerAssetsList.tsx` (mới)
- [ ] `FE/.../components/AddAsset.tsx` — seller UX
- [ ] `FE/.../components/CreatorStorefront.tsx` (Phase 2)
- [ ] `FE/.../components/AdminDashboard.tsx` — role seller
- [ ] `FE/.../components/AssetsMarketplace.tsx` — author link
- [ ] `FE/.../api/seller.ts` (mới)
- [ ] `FE/.../api/assets.ts` — `fetchMyAssets`

### Flutter

- [ ] `Flutter/lib/models/auth_models.dart`
- [ ] `Flutter/lib/screens/seller/` (mới, Phase 2)

### Docs

- [ ] `docs/BE_API_PLAN.md` — section Seller
- [ ] `docs/FE_BE_API_BACKLOG.md`
- [ ] `docs/FLUTTER_BACKLOG.md`
- [ ] `docs/README.md` — link plan này

---

## 14. Rủi ro & phạm vi không làm (giai đoạn 1)

### Rủi ro

| Rủi ro | Giảm thiểu |
|--------|------------|
| Catalog loạn nếu mở upload cho mọi customer | Chặn role; admin duyệt |
| Enum migration lỗi trên production | Chạy SQL trước; restart BE |
| Seller phàn nàn không nhận tiền | Phase 1 document rõ: chưa có payout |
| Trùng admin upload flow | Tách route seller, bỏ auto-approve trừ admin |

### Không làm trong Phase 1

- Payout VND / Stripe
- PWYW
- Bỏ admin duyệt asset
- Flutter upload đầy đủ
- Thay đổi mô hình subscription AI

---

## Tóm tắt 1 trang

1. **Thêm `seller` vào enum `user_role`** + BE/FE nhận role mới.
2. **Chỉ seller/admin được upload**; customer xem Seller Apply (phase 2).
3. **Seller Hub** (`/seller`) dùng API `GET /assets/me` đã có — UI mới.
4. **Admin cấp role** thủ công phase 1.
5. **Storefront** `/creator/:username` phase 2.
6. **Chia xu khi bán** phase 3 — sửa `OrderFulfillmentService`.
7. **Payout VND / auto-publish** phase 4 — gần itch.io đầy đủ.

Bắt đầu implement: **Phase 1** — ít rủi ro nhất, giá trị rõ cho demo và đồ án.

---

## Liên quan

- [ITCH_IO_VS_ASSETBOX.md](./ITCH_IO_VS_ASSETBOX.md)
- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)
- [BE_API_PLAN.md](./BE_API_PLAN.md)
- [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md)
- [itch.io Creator FAQ](https://itch.io/docs/creators/faq)
