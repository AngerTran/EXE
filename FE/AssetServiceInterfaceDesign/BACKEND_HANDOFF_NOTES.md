# Backend handoff notes (for future BE integration)

Tài liệu này mô tả các chức năng hiện có ở FE (đang chạy demo bằng `localStorage`) và gợi ý BE/API cần thiết để kết nối thật sau này.

> Scope: `FE/AssetServiceInterfaceDesign` (React + Vite). Hiện tại **KHÔNG có backend**, mọi dữ liệu (auth, assets, cart, orders, profile) được mô phỏng bằng `localStorage`.

---

## 1) Auth & User Profile

### Hiện tại FE đang làm gì?
- Login/Register bằng `localStorage`.
- User hiện hành lưu tại `localStorage["currentUser"]`.
- Danh sách user lưu tại `localStorage["users"]` (object map theo email).
- Profile route: `/profile` (protected).
- Cho phép cập nhật:
  - `name`
  - `avatarDataUrl` (base64 data URL) **(tạm thời)**.

### Đề xuất BE làm gì?
#### Auth
- Nên chuyển sang Auth thật (JWT/cookie session).
- FE sẽ cần:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /me`
  - `PATCH /me` (update profile)
  - `POST /auth/forgot-password` + `POST /auth/reset-password` (nếu muốn hỗ trợ)

#### User profile fields (gợi ý)
- `id` (uuid)
- `email`
- `name`
- `role`: `customer | admin`
- `credits` (number)
- `subscription`: `free | student | indie | pro`
- `subscription_expiry` (nullable date)
- `avatar_url` (nullable string) — **nên lưu URL/path, không lưu base64**

---

## 2) Avatar upload (Storage) — trạng thái hiện tại

### Hiện tại FE
- Chỉ lưu `avatarDataUrl` vào localStorage (không upload thật).

### Gợi ý triển khai chuẩn (khi có BE)
- Upload ảnh vào Storage (S3/Supabase Storage), DB chỉ lưu `avatar_url` hoặc `avatar_path`.
- Nếu bucket private:
  - BE cung cấp signed URL:
    - `POST /me/avatar` (upload) → trả `avatar_url/path`
    - `GET /me/avatar-url` hoặc `GET /files/signed?path=...`
- Nếu bucket public:
  - upload xong trả `public_url` trực tiếp.

Lưu ý:
- Ràng buộc file: `image/*`, limit size (FE đang dùng 1.5MB).
- Nên resize/convert (webp) ở BE hoặc edge function.

---

## 3) Assets & Marketplace

### Hiện tại FE đang làm gì?
- Marketplace route: `/marketplace`.
- Danh sách asset hiển thị lấy từ:
  - `getApprovedAssets()` (nguồn từ `asset_submissions`/admin assets) hoặc fallback `mockAssets`.
- Luồng submit asset:
  - `/add-asset` (protected) submit → lưu `localStorage["asset_submissions"]` với trạng thái `pending_review`.
- Admin duyệt:
  - approve/reject từ AdminDashboard → asset mới được “approved” để hiển thị ở marketplace.

### Đề xuất BE endpoints
- `GET /assets?status=approved&category=&q=&price=`
- `GET /assets/:id`
- `POST /assets` (creator submit)
- `PATCH /assets/:id` (admin edit)
- `POST /admin/assets/:id/approve`
- `POST /admin/assets/:id/reject` (kèm `reason`)

### Asset schema gợi ý
- `id` (uuid)
- `title`
- `category`
- `tags[]`
- `short_description`
- `description` (markdown/plain)
- `price` (number)
- `is_free` (boolean)
- `creator_id`, `creator_name`
- `thumbnail_url`
- `preview_urls[]`
- `zip_path` / `download_path`
- `engine_support`: `{ unity: boolean, unreal: boolean, godot: boolean }`
- `rating` (optional), `downloads` (counter)
- `status`: `pending_review | approved | rejected`
- `rejected_reason` (nullable)
- `created_at`, `submitted_at`, `approved_at`

---

## 4) Cart & Checkout

### Hiện tại FE
- Cart lưu theo user:
  - `localStorage["cart_<userId>"]` là mảng assetId.
- Checkout gói dịch vụ và checkout asset đang demo (localStorage).
- Sau thanh toán:
  - Orders lưu vào `localStorage["admin_orders"]`
  - Tài sản đã mua lưu vào `localStorage["purchased_assets_<userId>"]`

### Quy ước "xu" (FE demo) — để BE nối sau này
- FE demo đang dùng **xu** là đơn vị chính cho **giá/tổng tiền** khi hiển thị.
- **1 xu = 1 lượt chat AI** (1 message/send = trừ 1 xu, trừ server-side).
- Asset:
  - `price` được hiểu là **xu**.
  - `price = 0` là miễn phí.
  - Mua asset = trừ xu + tạo record sở hữu.
- Gói dịch vụ:
  - Khi thanh toán tiền thật, BE nên tạo order (real-money) và **cộng xu vào wallet** (top-up).
- Khuyến nghị BE:
  - `wallet.balance_xu` (int)
  - `wallet_ledger` ghi lịch sử cộng/trừ (topup_package, purchase_asset, ai_chat, refund…)
  - Dùng idempotency để tránh trừ xu 2 lần khi retry.

### Đề xuất BE endpoints
#### Cart (optional)
- `GET /cart`
- `POST /cart/items` (add)
- `DELETE /cart/items/:assetId`

#### Checkout
- `POST /checkout/assets` → tạo order + line items + payment intent
- `POST /checkout/packages` → tạo subscription/payment
- `POST /webhooks/payment` (nếu dùng Stripe/PayOS/...)

---

## 5) Orders & My Orders

### Hiện tại FE
- Route: `/orders` (protected) hiển thị lịch sử mua theo `userId`.
- Orders admin: tab Orders trong AdminDashboard.

### Đề xuất BE endpoints
- `GET /orders` (current user)
- `GET /orders/:id`
- `GET /admin/orders`
- `PATCH /admin/orders/:id` (status)

### Order schema gợi ý
- `id`
- `user_id`
- `items[]`: mỗi item `{ type: 'asset'|'package', ref_id, title, unit_price, quantity }`
- `total`
- `status`: `pending | completed | cancelled | refunded`
- `created_at`, `paid_at`
- `payment_provider`, `payment_ref`

---

## 6) Downloads (My Assets)

### Hiện tại FE
- MyAssets route: `/my-assets` (protected).
- “Download” đang giả lập progress; thực tế chưa có file thật.
- FE hiện tăng `downloadCount` khi bấm tải.

### Đề xuất BE
- Cần kiểm tra quyền sở hữu trước khi trả link tải:
  - `GET /me/assets` (assets đã mua)
  - `POST /assets/:id/download` → trả signed URL (private) hoặc redirect (public)
- Ghi nhận download:
  - increment `download_count` per user/asset
  - audit `download_logs`

---

## 7) Admin Management (Users / Packages / Assets)

### Hiện tại FE
- AdminDashboard có các tab:
  - Users: edit/view, delete (localStorage)
  - Assets: pending approve/reject + edit basic fields
  - Orders: view + confirm/cancel (demo)
  - Packages: add/edit/delete (localStorage `admin_packages`)

### Đề xuất BE endpoints
- `GET /admin/users`, `PATCH /admin/users/:id`, `DELETE /admin/users/:id`
- `GET /admin/packages`, `POST /admin/packages`, `PATCH /admin/packages/:id`, `DELETE /admin/packages/:id`
- `GET /admin/assets?status=pending_review`

Packages schema gợi ý:
- `id`, `name`, `price`, `credits` (có thể `-1` = unlimited), `sales`, `revenue`, `created_at`

---

## 8) localStorage keys đang dùng (để BE mapping về sau)

- `currentUser`
- `users`
- `asset_submissions`
- `admin_assets` (fallback / seed)
- `admin_orders`
- `admin_packages`
- `cart_<userId>`
- `purchased_assets_<userId>`

---

## 9) Gợi ý thứ tự kết nối BE (migration plan)

1. **Auth thật + /me** (thay localStorage user).
2. **Assets approved list** (GET /assets) + asset detail.
3. **Orders + Purchased assets** (GET /orders, GET /me/assets).
4. **Download signed URL** (POST /assets/:id/download).
5. **Admin APIs** (approve/reject, CRUD packages/users).
6. **Avatar upload + avatar_url** (Storage + DB).

