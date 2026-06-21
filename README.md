# EXE

AI-Powered Game Asset Marketplace Platform.

## Tài liệu

Xem **[docs/README.md](docs/README.md)** — mục lục đầy đủ.

### Nổi bật

- [Tài liệu phân tích hệ thống](docs/SYSTEM_ANALYSIS.md)
- [Plan Backend & REST API](docs/BE_API_PLAN.md)
- [Plan Mobile (PWA / Capacitor / Flutter)](docs/MOBILE_APP_PLAN.md)
- [Flutter App — hướng dẫn](docs/FLUTTER_APP.md)
- [Flutter — backlog còn thiếu](docs/FLUTTER_BACKLOG.md)
- [Quy tắc cập nhật tài liệu](docs/DOCUMENTATION_POLICY.md)
- [Supabase SQL Script (full)](supabase/schema.sql)

## Chạy nhanh

```bash
npm run dev          # BE :5180 + FE :5173
cd Flutter && flutter run   # Mobile app
```

## Deploy (bài tập / production)

Xem **[docs/DEPLOY.md](docs/DEPLOY.md)** — SQL, BE (Render/Docker), FE (Vercel), Supabase redirect.

Chuẩn bị Supabase trên máy dev:

```powershell
cd BE/scripts/SetupNewUserTrigger; dotnet run
cd ../ApplyNotificationsSql; dotnet run
cd ../EnsureStorageBuckets; dotnet run
```
