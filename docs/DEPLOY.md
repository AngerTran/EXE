# Hướng dẫn Deploy — EXE / AssetBox

Thứ tự thực hiện (đã tự động hóa bước 1–2 bằng script).

---

## Bước 1 — Chuẩn bị Supabase (SQL + buckets)

Chạy trên máy dev (cần `ConnectionStrings` trong `BE/appsettings.json` + user-secrets):

```powershell
cd BE/scripts/SetupNewUserTrigger && dotnet run
cd ../ApplyNotificationsSql && dotnet run
cd ../EnsureStorageBuckets && dotnet run
```

| Script | Mục đích |
|--------|----------|
| `SetupNewUserTrigger` | Trigger `handle_new_user` — profile/wallet khi đăng ký/OAuth |
| `ApplyNotificationsSql` | Bảng + trigger notifications |
| `EnsureStorageBuckets` | Buckets `asset-files`, `asset-images`, `avatars` |

---

## Bước 2 — Deploy Backend

### Option A: Render (Docker, khuyên dùng)

1. [render.com](https://render.com) → New **Web Service** → Connect repo GitHub `EXE`
2. **Root Directory:** để trống hoặc repo root
3. Chọn **Docker** — Render đọc `render.yaml` hoặc set:
   - Dockerfile path: `BE/Dockerfile`
   - Docker context: `BE`
4. Thêm **Environment Variables**:

| Biến | Giá trị |
|------|---------|
| `Supabase__ServiceRoleKey` | Secret key Supabase |
| `OPENAI_API_KEY` | OpenAI API key |
| `Supabase__FrontendBaseUrl` | `https://YOUR-FE.vercel.app` |
| `Supabase__PasswordResetRedirectUrl` | `https://YOUR-BE.onrender.com/api/v1/auth/reset-callback` |
| `Payment__FeReturnUrl` | `https://YOUR-FE.vercel.app/checkout/return` |
| `Cors__AllowedOrigins__0` | `https://YOUR-FE.vercel.app` |

5. Deploy → lấy URL BE (vd. `https://exe-api.onrender.com`)

### Option B: Docker local / VPS

```powershell
cd BE
docker build -t exe-api .
docker run -p 8080:8080 `
  -e Supabase__ServiceRoleKey=... `
  -e OPENAI_API_KEY=... `
  -e Cors__AllowedOrigins__0=https://your-fe.vercel.app `
  exe-api
```

Swagger: `http://localhost:8080/swagger`

---

## Bước 3 — Supabase Auth Redirect URLs

Dashboard → **Authentication** → **URL Configuration**:

| Loại | URL |
|------|-----|
| Site URL | `https://YOUR-FE.vercel.app` |
| Redirect URLs | `https://YOUR-FE.vercel.app/auth/callback` |
| | `https://YOUR-FE.vercel.app/auth/reset` |
| | `https://YOUR-BE.onrender.com/api/v1/auth/reset-callback` |

---

## Bước 4 — Deploy Frontend (Vercel)

1. [vercel.com](https://vercel.com) → Import repo
2. **Root Directory:** `FE/AssetServiceInterfaceDesign`
3. **Environment Variable (Production):**

```text
VITE_API_BASE_URL=https://YOUR-BE.onrender.com/api/v1
```

4. Deploy — `vercel.json` đã cấu hình SPA rewrite (F5 không 404)

---

## Bước 5 — Cập nhật lại BE (sau khi có URL FE thật)

Quay lại Render → sửa env nếu lúc đầu dùng placeholder:

- `Supabase__FrontendBaseUrl`
- `Cors__AllowedOrigins__0`
- `Payment__FeReturnUrl`
- `Supabase__PasswordResetRedirectUrl`

Redeploy BE.

---

## Bước 6 — Checklist test production

- [ ] `GET https://BE/api/v1/subscription-plans` → 200
- [ ] Đăng nhập / đăng ký trên FE deploy
- [ ] Marketplace load asset
- [ ] AI chat (cần `OPENAI_API_KEY`)
- [ ] Tải asset đã mua (cần `ServiceRoleKey`)
- [ ] Checkout CK → admin duyệt đơn tại `/admin`
- [ ] Google OAuth (nếu demo)
- [ ] Chuông thông báo

---

## Flutter (tuỳ chọn)

```powershell
flutter build apk --dart-define=API_BASE_URL=https://YOUR-BE.onrender.com/api/v1
```

---

## Lưu ý

- **Secret không commit** — dùng env trên Render/Vercel.
- **Thanh toán CK:** `AutoCompleteOnCreate=false` → cần admin xác nhận đơn.
- **Render free tier:** cold start ~30s lần đầu.
