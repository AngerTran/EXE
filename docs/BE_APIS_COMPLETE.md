# BE APIs — Bản đồ đầy đủ (map FE)

Base: `/api/v1` · Auth: `Authorization: Bearer <jwt>`

## Đã có từ trước (§4.1–4.6)

| Module | Endpoints | Map FE |
|--------|-----------|--------|
| Auth | register, login, me, logout | Auth.tsx, AuthContext |
| Plans | GET subscription-plans | Pricing, Checkout |
| Wallet | me, transactions, admin patch | Navbar, Admin users |
| Lookup | categories, tags, tag-groups | Marketplace, AddAsset |
| Assets | CRUD, approve, pending | Marketplace, AddAsset, Admin |
| Storage | upload-url, files, images, download | AddAsset, MyAssets |

## Mới (§4.7–4.14)

### 4.7 Cart — `AssetsMarketplace` giỏ hàng

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/cart` | Giỏ + preview asset |
| POST | `/cart/items` | `{ assetId, quantity }` |
| PATCH | `/cart/items/{id}` | Đổi số lượng |
| DELETE | `/cart/items/{id}` | Xóa 1 dòng |
| DELETE | `/cart` | Xóa hết (sau checkout) |

### 4.8 Orders — `Checkout`, `AssetsCheckout`, Admin orders

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/orders` | Đơn của user (`?status=`) |
| GET | `/orders?all=true` | **Admin** tất cả đơn (`?userId=`) |
| GET | `/orders/{id}` | Chi tiết đơn |
| POST | `/orders/subscription` | Mua gói `{ planId, paymentMethod }` |
| POST | `/orders/assets` | Checkout giỏ `{ paymentMethod, useSubscriptionFreeAssets }` |
| PATCH | `/orders/{id}/status` | **Admin** đổi trạng thái |

**MVP payment:** `Payment:AutoCompleteOnCreate=true` → thanh toán mock hoàn tất ngay (giống FE `setTimeout`).

### 4.9 Payments

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/payments` | Lịch sử user |
| GET | `/payments/{id}` | Chi tiết |
| POST | `/payments/webhook/momo` | Webhook (body: `transactionId` = payment UUID) |
| POST | `/payments/webhook/vnpay` | Webhook VNPay |

### 4.10 User Assets — `MyAssets.tsx`

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/user-assets` | Thư viện đã mua/tải free |
| GET | `/user-assets/{assetId}` | Chi tiết + download URL |
| POST | `/user-assets/{assetId}/download` | Tải + tăng download_count |

### 4.11 Bookmarks & Reviews

| Method | Path | Chức năng |
|--------|------|-----------|
| GET/POST/DELETE | `/bookmarks` | Yêu thích asset |
| GET/POST | `/assets/{id}/reviews` | Xem / tạo review |
| PATCH/DELETE | `/reviews/{id}` | Sửa/xóa review của mình |

### 4.12 AI Advisor — `Dashboard.tsx`

| Method | Path | Chức năng |
|--------|------|-----------|
| GET/POST | `/ai/sessions` | Danh sách / tạo phiên |
| GET/PATCH/DELETE | `/ai/sessions/{id}` | Chi tiết / đổi tên / archive / xóa |
| POST | `/ai/sessions/{id}/messages` | Gửi prompt → trừ 1 xu (trừ unlimited) + gợi ý asset |
| GET | `/ai/sessions/{id}/export` | Export markdown |

### 4.13 Admin — `AdminDashboard.tsx`

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/admin/overview` | Stats tổng quan |
| GET | `/admin/users` | Danh sách user (`?search`, `?role`) |
| PATCH | `/admin/users/{id}` | Ban, role, wallet balance |

### 4.14 Subscriptions (user)

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/subscriptions/me` | Gói đang active |
| GET | `/subscriptions/me/history` | Lịch sử gói |
| POST | `/subscriptions/cancel` | Hủy gói |

## Luồng FE → API (thay localStorage)

```text
cart_{userId}           → GET/POST /cart
purchased_assets_*      → GET /user-assets + POST checkout
checkout package        → POST /orders/subscription
checkout-assets         → POST /orders/assets
chat_history_*          → /ai/sessions + messages
admin_orders            → GET /orders?all=true
admin users             → GET /admin/users
```

## Chưa làm (ngoài scope plan chính)

- Contact form API
- Admin analytics chi tiết (`/admin/analytics/*`)
- Audit logs list
- Tích hợp MoMo/VNPay thật (hiện webhook + auto-complete)
