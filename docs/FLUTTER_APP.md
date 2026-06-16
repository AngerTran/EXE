# AssetBox Mobile — Flutter App

App mobile **AssetBox** — port giao diện web React sang Flutter native, gọi cùng **ASP.NET Core API** (`BE/`).

**Backlog còn thiếu:** [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md)  
**Lịch sử thay đổi:** [FLUTTER_CHANGELOG.md](./FLUTTER_CHANGELOG.md)

---

## Kiến trúc

```text
Flutter/lib/
├── config/          # API base URL (AppConfig)
├── core/            # Theme, router (go_router)
├── models/          # DTO mirror BE (camelCase JSON)
├── services/        # API client — mirror FE src/api/
├── providers/       # Riverpod (auth, service injection)
├── screens/         # Màn hình mobile
└── widgets/         # AssetCard, XuBadge, ChatBubble, ...
```

**Stack:** Flutter 3.12+, Riverpod, go_router, Dio, shared_preferences, google_fonts, cached_network_image.

---

## Màn hình hiện có (v1 scaffold)

| Route | Màn hình | Trạng thái |
|-------|----------|------------|
| `/` | Trang chủ | 🟡 MVP |
| `/marketplace` | Marketplace | 🟡 MVP |
| `/marketplace/:id` | Chi tiết asset | 🟡 MVP |
| `/ai` | AssetBox AI chat | 🟡 MVP |
| `/library` | Thư viện asset | 🟡 MVP |
| `/profile` | Hồ sơ & ví xu | 🟡 MVP |
| `/pricing` | Gói dịch vụ | 🟡 MVP |
| `/auth` | Đăng nhập / Đăng ký / Quên MK / Google | ✅ |
| `/auth/callback` | OAuth callback (deep link) | ✅ |
| `/auth/reset` | Đặt lại mật khẩu (deep link) | ✅ |
| `/profile/edit` | Sửa tên + avatar | ✅ |

Chi tiết đầy đủ so với web: xem [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md).

---

## Services đã implement

| Flutter | File | Web tương ứng |
|---------|------|----------------|
| `ApiClient` | `services/api_client.dart` | `api/client.ts` |
| `AuthService` | `services/auth_service.dart` | `api/auth.ts` — **đủ endpoint user** |
| `SupabaseOAuthService` | `services/supabase_oauth_service.dart` | OAuth Google PKCE |
| `AssetService` | `services/asset_service.dart` | `api/assets.ts` |
| `AiService` | `services/ai_service.dart` | `api/ai.ts` |
| `LookupService` | `services/lookup_service.dart` | `api/lookup.ts` |
| `WalletService` | `services/lookup_service.dart` | `api/wallets.ts` |
| `UserAssetService` | `services/lookup_service.dart` | `api/userAssets.ts` |
| `SubscriptionService` | `services/lookup_service.dart` | `api/subscriptionPlans.ts` |

---

## Chạy dev

```bash
# Terminal 1 — Backend + Web (từ root repo)
npm run dev

# Terminal 2 — Flutter
cd Flutter
flutter pub get
flutter run
```

### API base URL

| Nền tảng | Mặc định |
|----------|----------|
| Windows / iOS Simulator | `http://localhost:5180/api/v1` |
| Android Emulator | `http://10.0.2.2:5180/api/v1` |
| Thiết bị thật | IP máy dev |

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:5180/api/v1
```

### Android HTTP local + deep links

`Flutter/android/app/src/main/AndroidManifest.xml` — `usesCleartextTraffic` (dev), intent-filter `vn.assetbox.app://auth`.

### Supabase Redirect URLs (bắt buộc cho OAuth & reset MK)

Thêm trong Supabase Dashboard → Authentication → URL Configuration:

- `vn.assetbox.app://auth/callback`
- `vn.assetbox.app://auth/reset`

---

## Design

Theme **Kinetic Tech Dark** — mirror `FE/AssetServiceInterfaceDesign/src/design-system/tokens.ts`:

- Primary `#00d9ff`, Secondary `#a855f7`, Background `#0a0e1a`
- Bottom nav mirror `mobileNav` (authenticated / guest)

---

## Build release

```bash
cd Flutter
flutter build apk
flutter build appbundle
flutter build ios   # cần macOS + Xcode
```

---

## Liên quan

- [MOBILE_APP_PLAN.md](./MOBILE_APP_PLAN.md)
- [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md)
- Web FE: `FE/AssetServiceInterfaceDesign/`
- Code Flutter: `Flutter/`
