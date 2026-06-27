# Tiến độ: Role Seller

**Cập nhật:** 2026-06-22  
**Trạng thái:** BE + FE Web ✅ — Flutter chưa làm

---

## Database (Supabase)

| Hạng mục | Trạng thái |
|----------|------------|
| `add_seller_migration.sql` Block 1–2 | ✅ |
| Block 3 `wallet_tx_type` SELLER_SALE / SELLER_PAYOUT | ⏳ Cần chạy để chia xu |

---

## Backend ✅

Xem mục API trong commit / `SELLER_ROLE_PLAN.md` §7.

---

## Frontend Web ✅

| Màn / Route | File | Trạng thái |
|-------------|------|------------|
| `/seller` Seller Hub | `SellerDashboard.tsx` | ✅ |
| `/seller/upload` | `ProtectedSellerUpload` + `AddAsset.tsx` | ✅ |
| `/seller/apply` | `SellerApply.tsx` | ✅ |
| `/creator/:username` | `CreatorStorefront.tsx` | ✅ |
| Admin duyệt seller | `SellerApplicationsTab.tsx` + tab Admin | ✅ |
| Auth `seller` role | `api/types/auth.ts`, `AuthContext` | ✅ |
| Nav Seller Hub / Đăng ký | `Root.tsx`, `Profile.tsx` | ✅ |
| Marketplace link tác giả | `AssetsMarketplace.tsx` → `/creator/:username` | ✅ |
| Chặn customer upload | `ProtectedAddAsset` `requireSeller` | ✅ |

### API modules mới

- `src/api/seller.ts`
- `src/api/creators.ts`
- `src/api/admin.ts` — seller applications

---

## Flutter — Chưa làm

- `isSeller` trong auth models
- Màn Seller Hub mobile

---

## Test nhanh

1. Admin cấp `role=seller` hoặc duyệt đơn `/seller/apply`
2. Login seller → `/seller` — stats, assets, earnings
3. `/seller/upload` — tạo asset
4. Public `/creator/{username}`
5. Customer vào `/add-asset` → redirect `/seller/apply`
