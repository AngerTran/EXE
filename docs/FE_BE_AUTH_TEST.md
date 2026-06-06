# Test §4.1 Auth & Profile — FE ↔ BE

## Chuẩn bị

1. **BE** — `d:\EXE\BE`:
   - Copy `appsettings.Development.example.json` → `appsettings.Development.json`
   - Điền `ConnectionStrings`, `Supabase:Url`, `Supabase:AnonKey`, `Jwt:...`
   - Chạy: `dotnet run` → http://localhost:5180/swagger

2. **FE** — `d:\EXE\FE\AssetServiceInterfaceDesign`:
   - Copy `.env.example` → `.env`
   - `npm install` (lần đầu)
   - `npm run dev` → http://localhost:5173

3. **Supabase Auth**
   - Tắt bắt buộc confirm email (dev): Authentication → Providers → Email → *Confirm email* OFF  
     hoặc đăng ký rồi confirm mail trước khi login.
   - User mới có profile/wallet do trigger Supabase — chạy `docs/sql/handle_new_user.sql` hoặc `dotnet run --project BE/scripts/SetupNewUserTrigger` nếu `GET /auth/me` 404.

4. **Avatar (tuỳ chọn)**
   - `Supabase:ServiceRoleKey` + bucket `avatars` (xem `docs/ASSET_STORAGE_4_6.md`).

## Luồng test trên UI

| Bước | Trang | API |
|------|-------|-----|
| 1 | `/auth` → Đăng ký | `POST /auth/register` |
| 2 | `/auth` → Đăng nhập | `POST /auth/login` → token `exe_access_token` |
| 3 | Navbar | `GET /auth/me` (hydrate khi F5) |
| 4 | `/profile` → đổi tên | `PATCH /auth/me` |
| 5 | `/profile` → upload ảnh | `POST .../avatar/upload-url` → PUT storage → `POST .../avatar` |
| 6 | Đăng xuất | `POST /auth/logout` + xóa token |

## Test bằng Swagger

1. `POST /api/v1/auth/register` hoặc `login` → copy `accessToken`
2. Authorize Bearer token
3. `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me`

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| FE: "Không kết nối được BE" | BE chưa chạy hoặc sai `VITE_API_BASE_URL` |
| CORS | Thêm origin FE trong `Cors:AllowedOrigins` (mặc định có `5173`) |
| 401 login | Sai pass hoặc email chưa confirm |
| 404 `/auth/me` | Chưa có row `profiles` — chạy `SetupNewUserTrigger` hoặc đăng ký lại; BE cũng tự tạo profile khi có JWT email |
| Upload avatar fail | Thiếu `ServiceRoleKey` / bucket `avatars` |
| Link reset mở `localhost:3000` / connection refused | **Site URL** Supabase đang là `3000` — sửa theo mục dưới |
| `otp_expired` khi bấm link reset | Link đã hết hạn hoặc đã dùng — gửi lại email sau khi sửa URL |

## Quên mật khẩu (reset)

**Cách A — Cầu nối BE (khuyên dùng, giữ FE 5173):**

1. Supabase → Authentication → **Redirect URLs**, thêm:
   `http://localhost:5180/api/v1/auth/reset-callback`
2. BE: `PasswordResetRedirectUrl` trỏ URL trên; `FrontendBaseUrl` = `http://localhost:5173`.
3. Luồng: email → Supabase → BE callback → FE `/auth/reset` (token giữ nguyên).

**Cách B — Redirect thẳng FE:**

1. Site URL = `http://localhost:5173`, Redirect URLs = `http://localhost:5173/auth/reset`
2. `PasswordResetRedirectUrl` = `http://localhost:5173/auth/reset`

Gửi **email reset mới** sau khi đổi cấu hình. Mỗi link chỉ dùng một lần.

## Phần chưa nối BE (các sprint sau)

- Marketplace, checkout, cart, admin CRUD — vẫn localStorage
- Demo accounts trong Auth UI — chỉ điền form, **không** đăng nhập nếu chưa có user Supabase
