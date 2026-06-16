# Flutter — Changelog

Lịch sử thay đổi app mobile AssetBox.  
**Quy tắc:** mỗi lần sửa/thêm Flutter → thêm entry mới ở đầu file.  
Xem [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md).

---

## 2026-06-15 — Customer features v2 (commerce, library, AI, static)

### Đã làm

- **Commerce:** `CartService`, `OrdersService`, `PaymentsService` + màn giỏ, checkout (gói/xu/asset), đơn hàng, QR chuyển khoản, poll trạng thái
- **Marketplace:** filter tag/giá, sort; bookmark; reviews trên chi tiết asset; related assets
- **Library:** chi tiết asset, tải file + share (`path_provider`, `share_plus`), xóa khỏi thư viện
- **AI:** drawer danh sách phiên, tạo/xóa phiên, generate outline, export
- **Pricing:** gói nạp xu + checkout thật
- **Profile:** lịch sử gói, link đơn hàng, contact/terms/privacy
- **Home:** stats, tính năng, 4 bước
- **Static:** contact, terms, privacy

### Files chính

- `Flutter/lib/services/cart_service.dart`, `orders_service.dart`, `payments_service.dart`, ...
- `Flutter/lib/screens/commerce/*`, `screens/static/*`, `screens/library/user_asset_detail_screen.dart`
- `Flutter/lib/core/router/app_router.dart` — routes mới

---

## 2026-06-12 — Auth hoàn chỉnh (mobile)

### Đã làm

- **Auth UI:** đăng nhập/đăng ký, quên MK, hiện/ẩn mật khẩu, ghi nhớ đăng nhập, Google OAuth
- **Deep link:** `/auth/callback`, `/auth/reset` (`vn.assetbox.app://auth/...`)
- **Profile:** sửa tên, upload avatar (gallery/camera), màn `edit_profile_screen`
- **Services:** `AuthService` đầy đủ + `SupabaseOAuthService`
- **Bootstrap:** splash khi hydrate token; `authErrorMessage` tiếng Việt

### Cấu hình Supabase cần thêm Redirect URLs

- `vn.assetbox.app://auth/callback`
- `vn.assetbox.app://auth/reset`

### Files chính

- `Flutter/lib/services/auth_service.dart`, `supabase_oauth_service.dart`
- `Flutter/lib/screens/auth/*`, `screens/profile/edit_profile_screen.dart`
- `Flutter/lib/app.dart` (deep links), `config/auth_deep_links.dart`

---

## 2026-06-12 — Tài liệu hóa backlog & chuyển docs vào `docs/`

### Đã làm

- Gom tài liệu Flutter vào `docs/` (`FLUTTER_APP.md`, `FLUTTER_BACKLOG.md`, `DOCUMENTATION_POLICY.md`)
- Tạo `docs/README.md` — mục lục toàn bộ tài liệu dự án
- Tổng hợp màn hình & API còn thiếu so với web FE

### API / màn hình

- Không đổi code — chỉ cập nhật tài liệu
- Backlog chi tiết: [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md)

---

## 2026-06-12 — Scaffold Flutter v1 (MVP)

### Đã làm

- Tạo project `Flutter/` (`assetbox_mobile`)
- Theme Kinetic Tech Dark, bottom nav (guest / authenticated)
- Services: ApiClient, Auth, Asset, AI, Lookup, Wallet, UserAsset, Subscription
- Màn hình MVP: Home, Marketplace, Asset detail, AI chat, Library, Profile, Pricing, Auth

### API / màn hình

- ✅ Auth: login, register, logout, me
- ✅ Assets: list, detail
- ✅ AI: sessions, send message
- ✅ Categories, subscription plans, wallet transactions, user-assets list
- ⏳ Xem [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md) cho phần còn lại

### Files chính

- `Flutter/lib/main.dart`, `app.dart`
- `Flutter/lib/services/*`
- `Flutter/lib/screens/*`
- `Flutter/pubspec.yaml`
