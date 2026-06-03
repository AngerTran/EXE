# FE ↔ BE — Backlog API hoàn chỉnh

Base: `/api/v1` · Auth: `Authorization: Bearer <supabase_access_token>`

**Chú thích trạng thái**

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ **Có sẵn** | Đã implement — chỉ cần nối FE |
| 🔧 **Cần sửa** | Endpoint có nhưng cần chỉnh logic/DTO/bảo mật cho khớp FE & production |
| ➕ **Cần thêm** | Module đã có, thiếu endpoint cho UI FE |
| 🆕 **Cần làm mới** | Chưa có module/controller |

---

## Tổng quan số lượng

| Loại | Số lượng (ước lượng) |
|------|----------------------|
| ✅ Có sẵn (nối FE) | **52** endpoints |
| 🔧 Cần sửa | **12** hạng mục |
| ➕ Cần thêm | **18** endpoints |
| 🆕 Cần làm mới | **3** module (~15 endpoints) |

---

# PHẦN A — APIs ✅ CÓ SẴN (chỉ nối FE)

## A.1 Auth & Profile — `Auth.tsx`, `AuthContext`, `Profile.tsx`, `Root.tsx` ✅ FE↔BE (test: `docs/FE_BE_AUTH_TEST.md`)

| Method | Path | FE trang / component |
|--------|------|----------------------|
| POST | `/auth/register` | Auth — đăng ký ✅ |
| POST | `/auth/login` | Auth — đăng nhập ✅ |
| POST | `/auth/logout` | Auth / Root — đăng xuất ✅ |
| GET | `/auth/me` | AuthContext hydrate, Profile, Navbar ✅ |
| PATCH | `/auth/me` | Profile — đổi `name` ✅ |
| POST | `/auth/me/avatar/upload-url` + `/auth/me/avatar` | Profile — upload avatar ✅ |

## A.2 Wallet — Navbar, Admin Users

| Method | Path | FE |
|--------|------|-----|
| GET | `/wallets/me` | Navbar credits (`balance`, `isUnlimited`) |
| GET | `/wallets/me/transactions` | Profile / Wallet history *(UI chưa có, API sẵn)* |
| PATCH | `/wallets/{userId}` | Admin — cộng/trừ xu + `reason` |

## A.3 Subscription Plans (read-only) — `Pricing.tsx`, `Checkout.tsx`

| Method | Path | FE |
|--------|------|-----|
| GET | `/subscription-plans` | Pricing — danh sách gói |
| GET | `/subscription-plans/slug/{slug}` | Pricing / Checkout — `free`, `student`, `indie`, `pro` |
| GET | `/subscription-plans/{id}` | Checkout — xác nhận `planId` |

## A.4 Subscriptions (user) — `Profile.tsx`, `Pricing.tsx`

| Method | Path | FE |
|--------|------|-----|
| GET | `/subscriptions/me` | Profile, Marketplace “free với gói” |
| GET | `/subscriptions/me/history` | Profile *(phase 2 — tab lịch sử)* |
| POST | `/subscriptions/cancel` | Profile *(phase 2 — nút hủy gói)* |

## A.5 Lookup — `AssetsMarketplace`, `AddAsset`

| Method | Path | FE |
|--------|------|-----|
| GET | `/categories` | Marketplace filter, AddAsset dropdown |
| GET | `/tags` | Marketplace filter `?groupId=` |
| GET | `/tag-groups` | AddAsset tags (thay `TAG_GROUPS` hardcode) |

## A.6 Assets — `AssetsMarketplace`, `AddAsset`, `AdminDashboard`

| Method | Path | FE |
|--------|------|-----|
| GET | `/assets` | Marketplace list |
| GET | `/assets/pending` | Admin — chờ duyệt |
| GET | `/assets/slug/{slug}` | Marketplace SEO/detail *(optional)* |
| GET | `/assets/{id}` | Drawer `?details=` |
| POST | `/assets` | AddAsset submit |
| PATCH | `/assets/{id}` | AddAsset sửa *(owner, draft/pending only)* |
| DELETE | `/assets/{id}` | Owner xóa asset |
| PATCH | `/assets/{id}/approve` | Admin duyệt |
| PATCH | `/assets/{id}/reject` | Admin từ chối `{ reason }` |

## A.7 Storage — `AddAsset`, `MyAssets`

| Method | Path | FE |
|--------|------|-----|
| POST | `/assets/{assetId}/upload-url` | AddAsset — zip/ảnh |
| POST | `/assets/{assetId}/files` | Metadata zip sau PUT Supabase |
| POST | `/assets/{assetId}/images` | Metadata ảnh + thumbnail |
| GET | `/assets/{assetId}/download` | MyAssets / đã mua — signed URL |

## A.8 Cart — `AssetsMarketplace`, `AssetsCheckout`

| Method | Path | FE |
|--------|------|-----|
| GET | `/cart` | Giỏ + preview |
| POST | `/cart/items` | Thêm `{ assetId, quantity }` |
| PATCH | `/cart/items/{id}` | Đổi số lượng |
| DELETE | `/cart/items/{id}` | Xóa dòng |
| DELETE | `/cart` | Xóa hết sau checkout |

## A.9 Orders — `Checkout`, `AssetsCheckout`, `MyOrders`, Admin Orders

| Method | Path | FE |
|--------|------|-----|
| GET | `/orders` | MyOrders |
| GET | `/orders?all=true` | Admin tab Orders |
| GET | `/orders?all=true&userId=` | Admin filter theo user |
| GET | `/orders/{id}` | MyOrders chi tiết |
| POST | `/orders/subscription` | Checkout gói |
| POST | `/orders/assets` | Checkout giỏ |
| PATCH | `/orders/{id}/status` | Admin confirm/cancel |

## A.10 Payments — `Checkout`, `MyOrders` *(tuỳ chọn)*

| Method | Path | FE |
|--------|------|-----|
| GET | `/payments` | Lịch sử thanh toán *(chưa có trang)* |
| GET | `/payments/{id}` | Chi tiết payment theo order |
| POST | `/payments/webhook/momo` | Server-side (không gọi từ FE) |
| POST | `/payments/webhook/vnpay` | Server-side |

## A.11 User Assets — `MyAssets`

| Method | Path | FE |
|--------|------|-----|
| GET | `/user-assets` | Thư viện đã mua |
| GET | `/user-assets/{assetId}` | Chi tiết + download hint |
| POST | `/user-assets/{assetId}/download` | Nút tải + tăng counter |

## A.12 Bookmarks — *(FE chưa có UI, API sẵn)*

| Method | Path | FE (phase 2) |
|--------|------|----------------|
| GET | `/bookmarks` | Marketplace — danh sách yêu thích |
| POST | `/bookmarks` | `{ assetId }` |
| DELETE | `/bookmarks/{assetId}` | Bỏ yêu thích |

## A.13 Reviews — *(FE drawer chưa có UI, API sẵn)*

| Method | Path | FE (phase 2) |
|--------|------|----------------|
| GET | `/assets/{assetId}/reviews` | Drawer asset |
| POST | `/assets/{assetId}/reviews` | `{ rating, comment }` |
| PATCH | `/reviews/{id}` | Sửa review của mình |
| DELETE | `/reviews/{id}` | Xóa review |

## A.14 AI Advisor — `Dashboard.tsx`

| Method | Path | FE |
|--------|------|-----|
| GET | `/ai/sessions` | Sidebar danh sách phiên |
| POST | `/ai/sessions` | Tạo phiên `{ title? }` |
| GET | `/ai/sessions/{id}` | Load messages |
| PATCH | `/ai/sessions/{id}` | Đổi tên |
| DELETE | `/ai/sessions/{id}` | Xóa/archive |
| POST | `/ai/sessions/{id}/messages` | Gửi prompt — trừ xu |
| GET | `/ai/sessions/{id}/export` | Export markdown |

## A.15 Admin — `AdminDashboard.tsx` (phần đã có)

| Method | Path | FE tab |
|--------|------|--------|
| GET | `/admin/overview` | Tổng quan stats |
| GET | `/admin/users` | Users `?search&role&page` |
| PATCH | `/admin/users/{id}` | Sửa `role`, `status`, `walletBalance` |

---

# PHẦN B — APIs 🔧 CẦN SỬA (đã có, cần chỉnh)

| # | Endpoint hiện tại | Vấn đề | Cách sửa đề xuất | FE liên quan |
|---|-------------------|--------|------------------|--------------|
| B1 | `POST /orders/subscription`, `POST /orders/assets` | Body `paymentMethod`: FE dùng `momo` \| `bank` \| `card`, BE parser có thể chỉ nhận `mock` | Mở rộng `PaymentMethodParser` map đúng enum; trả `paymentId` + `redirectUrl` khi không auto-complete | Checkout, AssetsCheckout |
| B2 | `Payment:AutoCompleteOnCreate` | MVP = true, bỏ qua cổng thật | Production: `false` + flow tạo payment pending → webhook complete | Checkout |
| B3 | `POST /payments/webhook/*` | `[AllowAnonymous]` chưa verify chữ ký MoMo/VNPay | Thêm HMAC/signature validation, idempotency | — |
| B4 | `GET /assets`, `AssetDetailResponse` | FE hiển thị **xu**; BE có `priceVnd` + `priceXu` | Thống nhất: list/detail trả `priceXu` primary, `displayPrice` hoặc doc rõ FE dùng field nào | Marketplace |
| B5 | `PATCH /assets/{id}` | Chỉ **owner**, status `draft` \| `pending_review` | Admin tab “sửa asset” không gọi được → xem **E8** (endpoint admin riêng) | AdminDashboard |
| B6 | `PATCH /admin/users/{id}` vs `PATCH /wallets/{userId}` | Trùng chức năng cộng xu (`walletBalance` vs `balance`+`reason`) | Gộp doc: admin nên dùng `PATCH /wallets/{userId}` có ledger; deprecate `walletBalance` trên user PATCH hoặc sync 2 nơi | Admin Users |
| B7 | `PATCH /auth/me` | FE upload **base64** `avatarDataUrl`; BE chỉ nhận `avatarUrl` string | Thêm flow upload avatar (phần C) rồi PATCH url | Profile |
| B8 | `POST /auth/register` \| `login` | Supabase rate limit / email confirm — FE demo account không dùng được | FE chuyển Supabase JS hoặc proxy BE; xử lý `requiresEmailConfirmation` trong UI | Auth |
| B9 | Storage config | `ServiceRoleKey` thiếu trong dev → upload/download lỗi | Bắt buộc config + error message rõ trong API response | AddAsset, MyAssets |
| B10 | `GET /admin/overview` | FE admin có thể cần thêm: doanh thu theo gói, chart | Bổ sung fields hoặc tách analytics API (**F2**) | Admin overview |
| B11 | `POST /orders/assets` | `useSubscriptionFreeAssets` — logic quota gói phải khớp `subscriptions/me` | Review business rule + test case | AssetsCheckout |
| B12 | CORS / Swagger | Đã có localhost:5173 | Thêm origin production khi deploy FE | Toàn app |

---

# PHẦN C — APIs ➕ CẦN THÊM (trong module hiện có)

## C.1 Auth & Profile

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| POST | `/auth/forgot-password` | Proxy Supabase reset email | Auth *(optional)* |
| POST | `/auth/reset-password` | Đổi password với token | Auth *(optional)* |
| POST | `/auth/me/avatar/upload-url` | Signed URL upload avatar (bucket `avatars`) | Profile |
| POST | `/auth/me/avatar` | Confirm path → cập nhật `profiles.avatar_url` | Profile |
| GET | `/auth/me/avatar` | Signed URL đọc (nếu bucket private) | Profile, Navbar |

## C.2 Assets & Marketplace

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| GET | `/assets/me` | Asset do user upload (mọi status) | AddAsset / “Tài sản của tôi” |
| GET | `/assets?featured=true&limit=6` | Asset nổi bật | Home *(optional)* |
| PATCH | `/admin/assets/{id}` | Admin sửa metadata asset **đã approved** | Admin Assets tab |
| DELETE | `/admin/assets/{id}` | Admin soft-delete asset | Admin Assets tab |
| GET | `/admin/assets` | List all `?status=&search=&page=` | Admin (thay chỉ pending) |

## C.3 Admin Users

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| DELETE | `/admin/users/{id}` | Xóa / deactivate user (soft) | Admin Users — `handleDelete` |
| GET | `/admin/users/{id}` | Chi tiết user + orders + assets | Admin user drawer |

## C.4 Subscription Plans (Admin CRUD)

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| POST | `/admin/subscription-plans` | Tạo gói | Admin tab Packages |
| PATCH | `/admin/subscription-plans/{id}` | Sửa giá, credits, features, `isActive` | Admin Packages |
| DELETE | `/admin/subscription-plans/{id}` | Vô hiệu hóa gói | Admin Packages |
| GET | `/admin/subscription-plans` | List kể cả inactive | Admin Packages |

## C.5 Payments (thanh toán thật)

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| POST | `/payments` | Tạo payment từ `orderId` + `method` → `paymentUrl` / QR | Checkout trước redirect MoMo/VNPay |
| GET | `/payments/by-order/{orderId}` | Trạng thái thanh toán theo đơn | Checkout polling |
| POST | `/payments/{id}/cancel` | Hủy payment pending | Checkout |

## C.6 Orders

| Method | Path đề xuất | Mô tả | FE |
|--------|--------------|-------|-----|
| GET | `/orders/me/summary` | Tổng đơn, tổng chi *(optional)* | MyOrders header |

---

# PHẦN D — APIs 🆕 CẦN LÀM MỚI (module chưa có)

## D.1 Contact — `Contact.tsx`

| Method | Path | Body | FE |
|--------|------|------|-----|
| POST | `/contact` | `name`, `email`, `phone?`, `gameIdea?`, `consultType`, `message` | Contact form submit |
| GET | `/admin/contact-inquiries` | — | Admin *(optional)* |
| PATCH | `/admin/contact-inquiries/{id}` | `status: new \| replied` | Admin *(optional)* |

**DB gợi ý:** bảng `contact_inquiries` hoặc gửi email qua service.

## D.2 Admin Analytics — `AdminDashboard` charts

| Method | Path | Mô tả | FE |
|--------|------|-------|-----|
| GET | `/admin/analytics/revenue` | `?from=&to=` — doanh thu theo ngày | Admin charts |
| GET | `/admin/analytics/users` | Đăng ký theo thời gian | Admin charts |
| GET | `/admin/analytics/assets` | Upload/download theo category | Admin charts |
| GET | `/admin/analytics/orders` | Đơn theo trạng thái | Admin tab Orders |

## D.3 Audit Logs — *(FE chưa có, compliance)*

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/audit-logs` | `?userId=&action=&page=` — đọc `audit_logs` |

---

# PHẦN E — Map nhanh: FE trang → API (sau khi hoàn thiện)

| Trang FE | Route | APIs dùng (ưu tiên) |
|----------|-------|---------------------|
| Home | `/` | *(tĩnh)* hoặc `GET /assets?featured=true` |
| Auth | `/auth` | §4.1 + forgot/reset *(optional)* |
| Pricing | `/pricing` | `GET /subscription-plans` |
| Contact | `/contact` | **🆕** `POST /contact` |
| Dashboard | `/dashboard` | §4.12 AI + `GET /wallets/me` |
| Marketplace | `/marketplace` | §4.4, §4.5, §4.7, §4.14, reviews/bookmarks phase 2 |
| My Assets | `/my-assets` | §4.10 + §4.6 download |
| Checkout | `/checkout` | §4.2, §4.8, §4.14, **C5** payments |
| Checkout Assets | `/checkout-assets` | §4.7, §4.8 |
| Add Asset | `/add-asset` | §4.5, §4.6, lookup |
| My Orders | `/orders` | §4.8, §4.9 |
| Profile | `/profile` | §4.1, §4.14, **C1** avatar |
| Admin | `/admin` | §4.13, §4.5 pending, §4.8, **C4** plans, **C2** admin assets, **D2** analytics |
| Terms/Privacy | `/terms`, `/privacy` | Không cần API |
| Navbar | `Root` | `GET /auth/me`, `GET /wallets/me` |

---

# PHẦN F — Thứ tự triển khai đề xuất

```text
Sprint 1 — Nối FE core (chỉ dùng API ✅ có sẵn)
  Auth, /me, wallets/me
  subscription-plans, orders/subscription
  assets list/detail, categories, tag-groups
  cart, orders/assets, user-assets
  ai/sessions

Sprint 2 — Sửa & production-ready
  B1–B3 payment method + webhook security
  B4 price xu alignment
  B9 storage config

Sprint 3 — Admin & Profile gaps
  C4 admin subscription-plans CRUD
  C2 admin assets PATCH/DELETE
  C1 avatar upload
  C3 DELETE admin user

Sprint 4 — FE phase 2 + marketing
  bookmarks, reviews UI
  D1 contact
  D2 analytics
  C5 real payment redirect
```

---

# PHẦN G — Checklist BE developer

- [x] **52+ endpoints** — mở rộng lên ~75 (Swagger)
- [x] **12 mục sửa** (Phần B) — payment methods, displayPrice, wallet admin, subscription free assets, CORS config, webhook secret
- [x] **18 endpoints thêm** (Phần C)
- [x] **3 module mới** (Phần D) — contact, analytics, audit logs
- [x] `docs/BE_APIS_COMPLETE.md` cập nhật
- [ ] Chạy `docs/sql/contact_inquiries.sql` trên Supabase
- [ ] `appsettings.Development.json`: `ServiceRoleKey`, `WebhookSecret`, production CORS

---

*Tài liệu đồng bộ với FE commit `47104d5a` và BE commit `113fe81d`.*
