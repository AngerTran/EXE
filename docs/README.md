# Tài liệu dự án EXE / AssetBox

Mục lục tài liệu chính. **Mọi thay đổi Flutter/mobile** cần cập nhật các file trong mục [Mobile / Flutter](#mobile--flutter).

---

## Hệ thống & Backend

| Tài liệu | Mô tả |
|----------|--------|
| [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) | Phân tích hệ thống, roles, business model |
| [BE_API_PLAN.md](./BE_API_PLAN.md) | Plan REST API backend |
| [BE_APIS_COMPLETE.md](./BE_APIS_COMPLETE.md) | Danh sách API đã hoàn thành |
| [FE_BE_API_BACKLOG.md](./FE_BE_API_BACKLOG.md) | Backlog API FE ↔ BE (web) |
| [FE_BE_AUTH_TEST.md](./FE_BE_AUTH_TEST.md) | Hướng dẫn test auth |
| [ASSET_STORAGE_4_6.md](./ASSET_STORAGE_4_6.md) | Asset storage Supabase |
| [DEPLOY.md](./DEPLOY.md) | **Deploy BE + FE** (Render, Vercel, env, Supabase) |

## Mobile / Flutter

| Tài liệu | Mô tả |
|----------|--------|
| [MOBILE_APP_PLAN.md](./MOBILE_APP_PLAN.md) | Plan tổng: PWA, Capacitor, Flutter |
| [FLUTTER_APP.md](./FLUTTER_APP.md) | Hướng dẫn app Flutter — kiến trúc, chạy dev |
| [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md) | **Màn hình & API còn thiếu** (so với web) |
| [FLUTTER_CHANGELOG.md](./FLUTTER_CHANGELOG.md) | Lịch sử thay đổi Flutter |
| [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md) | Quy tắc cập nhật MD sau mỗi lần sửa |

## SQL scripts

Thư mục [sql/](./sql/) — migration/seed tags, notifications, v.v.

## Frontend web (trong repo FE)

| Vị trí | Mô tả |
|--------|--------|
| `FE/AssetServiceInterfaceDesign/README.md` | Hướng dẫn web dev |
| `FE/AssetServiceInterfaceDesign/CLAUDE.md` | Design system & codebase guide |

---

**Cập nhật mục lục:** khi thêm file `.md` mới vào `docs/`, thêm dòng vào bảng tương ứng ở file này.
