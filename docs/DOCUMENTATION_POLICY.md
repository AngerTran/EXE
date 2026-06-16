# Quy tắc cập nhật tài liệu (Documentation Policy)

Áp dụng cho **Flutter mobile**, **mobile/PWA**, và các module có backlog riêng trong `docs/`.

---

## Khi nào phải cập nhật MD

Sau **mỗi lần** thêm hoặc sửa code liên quan mobile/Flutter, bắt buộc cập nhật tài liệu tương ứng:

| Loại thay đổi | File cần cập nhật |
|---------------|-------------------|
| Màn hình mới / sửa UI | [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md) — đánh dấu ✅; [FLUTTER_CHANGELOG.md](./FLUTTER_CHANGELOG.md) |
| Service / API mới | [FLUTTER_BACKLOG.md](./FLUTTER_BACKLOG.md) — bảng API; [FLUTTER_APP.md](./FLUTTER_APP.md) nếu đổi kiến trúc |
| Cấu hình chạy dev / build | [FLUTTER_APP.md](./FLUTTER_APP.md) |
| Quyết định kiến trúc mobile | [MOBILE_APP_PLAN.md](./MOBILE_APP_PLAN.md) hoặc ghi chú trong CHANGELOG |
| Thêm file docs mới | [docs/README.md](./README.md) — thêm vào mục lục |

---

## FLUTTER_CHANGELOG — format mỗi entry

```markdown
## YYYY-MM-DD — Tiêu đề ngắn

### Đã làm
- Bullet mô tả thay đổi (màn, service, widget...)

### API / màn hình
- ✅ Đã xong: ...
- ⏳ Còn lại: ... (hoặc cập nhật FLUTTER_BACKLOG)

### Files chính
- `Flutter/lib/...`
```

---

## FLUTTER_BACKLOG — cách đánh dấu

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ | Đã có trên Flutter (UI + service nếu cần) |
| 🟡 | Có một phần (UI đơn giản hoặc thiếu tính năng phụ) |
| ❌ | Chưa có |
| ⏭️ | Cố ý bỏ qua mobile v1 (vd. Admin) |

Sau khi hoàn thành mục ❌ → đổi thành ✅ và ghi ngày trong CHANGELOG.

---

## Checklist trước khi merge / kết thúc task

```
□ FLUTTER_BACKLOG.md phản ánh đúng trạng thái hiện tại
□ FLUTTER_CHANGELOG.md có entry ngày hôm nay
□ FLUTTER_APP.md còn đúng (nếu đổi cách chạy / dependency)
□ docs/README.md có link nếu tạo file MD mới
```

---

## Vị trí file

- **Tất cả tài liệu plan/backlog/changelog mobile** → `docs/`
- `Flutter/README.md` — chỉ pointer ngắn tới `docs/`, không duplicate nội dung dài
