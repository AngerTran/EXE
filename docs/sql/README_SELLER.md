# SQL — Seller (một file)

Chạy trên **Supabase SQL Editor**: [`add_seller_migration.sql`](./add_seller_migration.sql)

| Block | Nội dung | Cách chạy |
|-------|----------|-----------|
| **1** | `ALTER TYPE user_role ADD 'seller'` | Run một mình (nếu chưa có). Restart BE. |
| **2** | Profiles + `seller_applications` + `seller_earnings` | Run toàn bộ block 2 một lần |
| **3** | `wallet_tx_type` SELLER_SALE / SELLER_PAYOUT | Phase 3 — từng dòng, run riêng |
| **4** | `UPDATE profiles` cấp seller | Thay email, run riêng |

**Lưu ý:** Block 1 đã chạy rồi thì chỉ cần Block 2.

Xem: [SELLER_ROLE_PLAN.md](../SELLER_ROLE_PLAN.md) · [SELLER_ROLE_PROGRESS.md](../SELLER_ROLE_PROGRESS.md)
