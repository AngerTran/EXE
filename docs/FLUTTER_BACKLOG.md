# Flutter — Backlog màn hình & API

So sánh **Flutter mobile** (`Flutter/`) với **Web FE** (`FE/AssetServiceInterfaceDesign/`).

**Cập nhật lần cuối:** 2026-06-15 (Customer features v2)  
**Quy tắc cập nhật:** [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md)

---

## Chú thích trạng thái

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ | Đã có (đủ dùng cơ bản) |
| 🟡 | Có một phần — thiếu tính năng phụ so với web |
| ❌ | Chưa có |
| ⏭️ | Cố ý không làm mobile v1 |

---

## 1. Tổng quan tiến độ

| Hạng mục | Web (trang) | Flutter | Ghi chú |
|----------|-------------|---------|---------|
| Trang / route (customer) | 17 | 17 | ~100% (không tính admin, add-asset seller) |
| API module (FE) | 18 | 16 service | ~89% (không tính admin) |
| Endpoint customer ước lượng | ~65 | ~58 | Commerce + AI + library đủ dùng |

---

## 2. Màn hình (Web route → Flutter)

| Web route | Web component | Flutter | Trạng thái | Ghi chú |
|-----------|---------------|---------|------------|---------|
| `/` | `Home.tsx` | `home_screen.dart` | ✅ | Hero, stats, tính năng, 4 bước, asset nổi bật, quick actions |
| `/dashboard` | `Dashboard.tsx` | `ai_dashboard_screen.dart` | ✅ | Drawer phiên chat; outline generate/export; xóa session |
| `/marketplace` | `AssetsMarketplace.tsx` | `marketplace_screen.dart` | ✅ | Search, category, tag, price filter, sort; link bookmark/cart |
| `/marketplace` (detail) | Drawer / detail | `asset_detail_screen.dart` | ✅ | Bookmark, giỏ, reviews, related assets |
| `/my-assets` | `MyAssets.tsx` | `my_assets_screen.dart` + `user_asset_detail_screen.dart` | ✅ | Tải file (share), xóa khỏi thư viện, chi tiết |
| `/profile` | `Profile.tsx` | `profile_screen.dart` + `edit_profile_screen.dart` | ✅ | Ví xu, giao dịch, lịch sử gói, đơn hàng, liên kết static |
| `/pricing` | `Pricing.tsx` | `pricing_screen.dart` | ✅ | Gói subscription + gói nạp xu → checkout |
| `/auth` | `Auth.tsx` | `auth_screen.dart` | ✅ | |
| `/auth/callback` | `AuthCallback.tsx` | `auth_callback_screen.dart` | ✅ | |
| `/auth/reset` | `ResetPassword.tsx` | `reset_password_screen.dart` | ✅ | |
| `/checkout` | `Checkout.tsx` | `checkout_screen.dart` (subscription) | ✅ | QR chuyển khoản, poll đơn |
| `/checkout-credits` | `Checkout.tsx` (credits) | `checkout_screen.dart` (credits) | ✅ | |
| `/checkout-assets` | `AssetsCheckout.tsx` | `checkout_screen.dart` (assets) | ✅ | |
| `/orders` | `MyOrders.tsx` | `orders_screen.dart` | ✅ | Summary + danh sách đơn |
| `/cart` | (drawer web) | `cart_screen.dart` | ✅ | Icon giỏ trên AppBar |
| `/bookmarks` | (trong marketplace) | `bookmarks_screen.dart` | ✅ | |
| `/contact` | `Contact.tsx` | `contact_screen.dart` | ✅ | |
| `/terms` | `Terms.tsx` | `terms_screen.dart` | ✅ | Nội dung tóm tắt mobile |
| `/privacy` | `Privacy.tsx` | `privacy_screen.dart` | ✅ | Nội dung tóm tắt mobile |
| `/add-asset` | `AddAsset.tsx` | — | ⏭️ | Seller — phase sau |
| `/admin` | `AdminDashboard.tsx` | — | ⏭️ | Web only |

---

## 3. Services & API endpoints

### 3.1 Auth — ✅ đủ customer

### 3.2 Assets — `AssetService`

| Endpoint | Flutter | Ghi chú |
|----------|---------|---------|
| GET `/assets` | ✅ | search, category, tag, priceType, sort, featured |
| GET `/assets/{id}` | ✅ | |
| POST upload / admin | ⏭️ | |

### 3.3 AI — `AiService` — ✅

| Endpoint | Flutter | Ghi chú |
|----------|---------|---------|
| Sessions CRUD + messages | ✅ | Drawer UI |
| DELETE `/ai/sessions/{id}` | ✅ | |
| GET export, POST outline/refine | ✅ | Export dialog; outline bottom sheet |
| DELETE `/ai/sessions/empty` | 🟡 | API có, chưa gọi tự động |

### 3.4 Lookup — `LookupService` — ✅

| GET `/categories`, `/tags`, `/tag-groups` | ✅ |

### 3.5 Wallet — ✅ (qua `/auth/me` + transactions)

### 3.6 User assets — `UserAssetService` — ✅

| GET list/detail, POST download, GET file, DELETE | ✅ | `path_provider` + `share_plus` |

### 3.7 Subscription plans — ✅ + `CustomerSubscriptionService`

| Plans list, slug, `/subscriptions/me`, history, cancel | ✅ / 🟡 | Cancel API có, chưa UI nút hủy gói |

### 3.8 Commerce — ✅ mới

| Module | Service | UI |
|--------|---------|-----|
| Cart | `CartService` | `cart_screen`, badge AppBar |
| Orders | `OrdersService` | `orders_screen`, checkout |
| Payments | `PaymentsService` | QR trong checkout |
| Bookmarks | `BookmarksService` | marketplace + detail |
| Reviews | `ReviewsService` | asset detail |
| Credit packs | `CreditPackService` | pricing + checkout |
| Contact | `ContactService` | `contact_screen` |

### 3.9 Chưa làm (customer)

| Module | Ghi chú |
|--------|---------|
| `api/notifications.ts` | 🟡 Chưa bell + FCM |
| `api/subscriptions.ts` cancel UI | 🟡 API có, thiếu nút hủy gói |
| Đổi mật khẩu trong app | 🟡 Dùng forgot/reset flow |

### 3.10 Admin — ⏭️

---

## 4. Tính năng UI / UX

| Tính năng | Flutter |
|-----------|---------|
| Bottom navigation (guest vs auth) | ✅ |
| Giỏ hàng + badge | ✅ |
| Bookmark | ✅ |
| Pull-to-refresh | ✅ Home, marketplace, profile, library, pricing |
| Download / share file | ✅ |
| Theme dark/light | ❌ (chỉ dark) |
| Notification bell + FCM | ❌ |
| Push notifications | ❌ |

---

## 5. Models

| Model | Flutter |
|-------|---------|
| `commerce.ts` — Cart, Order | ✅ `commerce_models.dart` |
| `billing.ts` — CreditPack, SubscriptionMe | ✅ `billing_models.dart` |
| `ai.ts` — Outline | ✅ `ai_models.dart` |
| Tag, Review | ✅ `commerce_models.dart` |

---

## 6. Roadmap còn lại (optional)

1. Notifications + FCM
2. Nút hủy subscription trong profile
3. Đổi mật khẩu trong app (không qua email)
4. Upload asset (seller) — web trước
5. Light theme
6. Pixel animation hero (parity web)

---

## 7. Packages đã dùng

| Package | Mục đích |
|---------|----------|
| `supabase_flutter`, `app_links` | OAuth |
| `image_picker` | Avatar |
| `path_provider`, `share_plus` | Download asset |
| `url_launcher` | (sẵn có) |

---

## 8. Liên kết

- [FLUTTER_APP.md](./FLUTTER_APP.md)
- [FLUTTER_CHANGELOG.md](./FLUTTER_CHANGELOG.md)
- [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md)
