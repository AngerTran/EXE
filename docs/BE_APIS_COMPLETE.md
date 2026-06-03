# BE APIs — Bản đồ đầy đủ (cập nhật sau backlog)

Base: `/api/v1` · Auth: `Authorization: Bearer <jwt>`

## §4.1 Auth & Profile

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/auth/register` | Public | Đăng ký Supabase |
| POST | `/auth/login` | Public | Đăng nhập |
| POST | `/auth/logout` | Bearer | Đăng xuất |
| GET | `/auth/me` | Bearer | Profile + wallet + subscription |
| PATCH | `/auth/me` | Bearer | `name`, `avatarUrl` |
| POST | `/auth/forgot-password` | Public | Gửi email reset (Supabase recover) |
| POST | `/auth/me/avatar/upload-url` | Bearer | Signed URL upload avatar |
| POST | `/auth/me/avatar` | Bearer | Xác nhận path → cập nhật avatar |

## §4.2 Subscription Plans (public)

| Method | Path | Auth |
|--------|------|------|
| GET | `/subscription-plans` | Public |
| GET | `/subscription-plans/slug/{slug}` | Public |
| GET | `/subscription-plans/{id}` | Public |

## §4.3 Wallet

| Method | Path | Auth |
|--------|------|------|
| GET | `/wallets/me` | Bearer |
| GET | `/wallets/me/transactions` | Bearer |
| PATCH | `/wallets/{userId}` | Admin |

## §4.4 Lookup

| GET | `/categories`, `/tags`, `/tag-groups` | Public |

## §4.5 Assets

| Method | Path | Auth | Ghi chú |
|--------|------|------|---------|
| GET | `/assets` | Public | `?featured=true&limit=6` — home nổi bật |
| GET | `/assets/me` | Bearer | Asset user đã upload (mọi status) |
| GET | `/assets/pending` | Admin | Chờ duyệt |
| GET | `/assets/{id}`, `/assets/slug/{slug}` | Public | Chi tiết |
| POST/PATCH/DELETE | `/assets`, `/assets/{id}` | Bearer | Owner |
| PATCH | `/assets/{id}/approve`, `/reject` | Admin | |

**List item** có `priceXu` và `displayPrice` (cùng giá trị xu cho FE).

## §4.6 Storage

| POST | `/assets/{assetId}/upload-url` | Bearer (owner) |
| POST | `/assets/{assetId}/files`, `/images` | Bearer |
| GET | `/assets/{assetId}/download` | Bearer |

Bucket `avatars` cho profile avatar.

## §4.7 Cart

`GET/POST/PATCH/DELETE` `/cart`, `/cart/items`, `/cart/items/{id}`

## §4.8 Orders

| Method | Path |
|--------|------|
| GET | `/orders`, `/orders/{id}` |
| GET | `/orders/me/summary` |
| GET | `/orders?all=true` | Admin |
| POST | `/orders/subscription`, `/orders/assets` |
| PATCH | `/orders/{id}/status` | Admin |

**Checkout response** thêm `paymentId`, `paymentRedirectUrl` khi `Payment:AutoCompleteOnCreate=false`.

`paymentMethod`: `momo`, `vnpay`, `bank`, `card`, `mock`.

`useSubscriptionFreeAssets`: gói active (student/indie/pro/unlimited) → giảm total asset order.

## §4.9 Payments

| Method | Path |
|--------|------|
| GET | `/payments`, `/payments/{id}` |
| POST | `/payments` | `{ orderId, paymentMethod }` |
| GET | `/payments/by-order/{orderId}` |
| POST | `/payments/{id}/cancel` |
| POST | `/payments/webhook/momo`, `/vnpay` | Header `X-Webhook-Secret` nếu cấu hình |

## §4.10–4.14

Giữ nguyên: user-assets, bookmarks, reviews, ai/sessions, subscriptions/me.

## §4.15 Admin (mở rộng)

| Method | Path |
|--------|------|
| GET | `/admin/overview` |
| GET/PATCH/DELETE | `/admin/users`, `/admin/users/{id}` |
| GET/PATCH | `/admin/contact-inquiries` |
| GET | `/admin/audit-logs` |
| GET | `/admin/analytics/revenue`, `/users`, `/assets`, `/orders` |
| GET/POST/PATCH/DELETE | `/admin/subscription-plans` |
| GET/PATCH/DELETE | `/admin/assets` |

## §4.16 Contact

| POST | `/contact` | Public — form liên hệ |

## Cấu hình (`appsettings`)

```json
{
  "Cors": { "AllowedOrigins": ["http://localhost:5173", "..."] },
  "Payment": {
    "AutoCompleteOnCreate": true,
    "WebhookSecret": "",
    "PaymentRedirectUrlTemplate": "/checkout?paymentId={0}"
  },
  "Storage": { "AvatarsBucket": "avatars", "ServiceRoleKey": "..." }
}
```

## DB migration

Chạy `docs/sql/contact_inquiries.sql` trên Supabase trước khi dùng Contact API.

## Map FE

Xem `docs/FE_BE_API_BACKLOG.md` — Phần E.
