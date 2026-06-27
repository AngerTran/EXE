# So sánh itch.io Game Assets vs AssetBox

Tài liệu phân tích chi tiết [itch.io/game-assets](https://itch.io/game-assets) làm **chuẩn tham chiếu**, đối chiếu với web AssetBox hiện tại. Mục tiêu: chỉ rõ **thiếu sót, điểm yếu, sai thiết kế** — không phải marketing copy.

**Cập nhật:** 2026-06  
**Phạm vi code:** `FE/AssetServiceInterfaceDesign`, `BE/` (marketplace, orders, assets)

---

## Mục lục

1. [itch.io là gì (chuẩn tham chiếu)](#1-itchio-là-gì-chuẩn-tham-chiếu)
2. [AssetBox hiện tại (tóm tắt)](#2-assetbox-hiện-tại-tóm-tắt)
3. [Discovery — Tìm & khám phá asset](#3-discovery--tìm--khám-phá-asset)
4. [Trang asset — Product page](#4-trang-asset--product-page)
5. [Creator / Seller — Kinh tế người bán](#5-creator--seller--kinh-tế-người-bán)
6. [Buyer — Mua, thư viện, tin cậy](#6-buyer--mua-thư-viện-tin-cậy)
7. [Community & retention](#7-community--retention)
8. [Homepage & curation](#8-homepage--curation)
9. [Bảng điểm tổng hợp](#9-bảng-điểm-tổng-hợp)
10. [Danh sách sai / thiếu (ưu tiên sửa)](#10-danh-sách-sai--thiếu-ưu-tiên-sửa)
11. [Điểm mạnh AssetBox (ngoài itch.io)](#11-điểm-mạnh-assetbox-ngoài-itchio)
12. [Roadmap gợi ý](#12-roadmap-gợi-ý)
13. [File liên quan trong repo](#13-file-liên-quan-trong-repo)

---

## 1. itch.io là gì (chuẩn tham chiếu)

[itch.io/game-assets](https://itch.io/game-assets) không chỉ là danh sách file — là **hệ sinh thái creator-first** với 4 trụ:

| Trụ | itch.io làm gì |
|-----|----------------|
| **Discovery** | ~100k+ asset, filter đa chiều (type / style / engine / theme / format), sort 5 kiểu, tag page, collection, sale / bundle |
| **Creator economy** | Tự publish, tự định giá (free / fixed / PWYW), Stripe / PayPal payout, analytics, storefront riêng |
| **Trust & conversion** | Rating + review công khai, download count, preview GIF / video, file list trước mua, URL shareable |
| **Community** | Follow creator, jam, devlog, widget embed, co-op bundle |

**Mô hình kinh doanh itch.io:** Buyer trả tiền thật → Creator nhận tiền → itch.io lấy %. Không có ví nội bộ, không subscription AI.

### Filter itch.io (ví dụ)

- **Types:** Sprites, SFX, Music, Textures, Tileset, UI, Fonts…
- **Styles:** 2D, 3D, Pixel Art, 8-bit, Low-poly, Voxel…
- **Formats:** 16×16, 32×32, PNG, FBX, MIDI…
- **Themes:** Fantasy, Sci-fi, Platformer, Top-Down…
- **Tools:** Unity, Unreal, Blender
- **Misc:** Royalty Free, Asset Pack, Modular, On Sale
- **Sort:** Popular, New & Popular, Top sellers, Top rated, Most Recent

---

## 2. AssetBox hiện tại (tóm tắt)

| Khía cạnh | AssetBox |
|-----------|----------|
| **Định vị thực tế** | AI advisor + catalog asset curated cho sinh viên / indie VN |
| **Thanh toán asset** | **Xu** (nạp CK VND hoặc gói subscription) — không trả trực tiếp VND / USD cho từng asset |
| **Seller** | Upload → **admin duyệt** — không payout, không storefront |
| **Discovery** | Search + category tab + free/paid — sort cố định |
| **Chi tiết asset** | Sheet drawer, không trang riêng |
| **SEO** | `noindex, nofollow` toàn site |

**Kết luận một câu:** AssetBox **không phải** itch.io Việt Nam — gần hơn **catalog nội bộ** cho nền tảng AI + ví xu.

---

## 3. Discovery — Tìm & khám phá asset

**File chính:** `FE/.../AssetsMarketplace.tsx`, `BE/.../AssetRepository.cs`, `FE/.../api/assets.ts`

### 3.1 Bộ lọc (Filter)

| Tiêu chí itch.io | AssetBox | Gap |
|------------------|----------|-----|
| 15+ nhóm filter | Chỉ **category tab** + **free / paid / all** | 🔴 Critical |
| Filter engine (Unity / Unreal / Godot) | BE có field; **FE marketplace không lọc** | 🔴 Critical |
| Filter art style / theme / tags | BE có tags, `fetchTagGroups()`; **marketplace không dùng** | 🔴 Critical |
| Filter On Sale, bundle | Không có | 🔴 Critical |

**Thiếu rõ ràng:** Dev tìm “tileset 16×16 top-down Unity” trên AssetBox **gần như không làm được**.

### 3.2 Sort (sắp xếp)

| itch.io | AssetBox |
|---------|----------|
| Popular, Top sellers, Top rated, Most recent | **Cố định** `sort: "createdAt", order: "desc"` trong `AssetsMarketplace.tsx` |

BE hỗ trợ sort theo `downloadCount`, `ratingAvg`, `priceVnd`… — **UI không cho chọn**.

**Sai / inconsistent:** `Home.tsx` sort theo `downloadCount`; marketplace sort “mới nhất” → asset hot bị chôn trong chợ chính.

### 3.3 Tags & Collections

| itch.io | AssetBox |
|---------|----------|
| Tag cloud trên card, click → browse | Tag chỉ trong drawer, **không clickable** |
| User collections | Không có |
| Staff bundle / sale | Không có |

API có `?tag=` và `?featured=true` — **FE marketplace không gọi**.

### 3.4 Pagination

| itch.io | AssetBox |
|---------|----------|
| Page hoặc infinite scroll | `ClientPagination`, pageSize 12 | 🟡 Minor — ổn |

### Điểm Discovery

| | itch.io | AssetBox |
|--|---------|----------|
| **Điểm** | ~95/100 | ~25/100 |

---

## 4. Trang asset — Product page

**File chính:** `AssetsMarketplace.tsx` (drawer), `AssetPreviewGallery.tsx`, `AssetReviewsPanel.tsx`

### 4.1 URL & SEO

| itch.io | AssetBox |
|---------|----------|
| `creator.itch.io/asset-name` — indexable | `/marketplace?details={uuid}` — query param |
| Google index, OG meta | `index.html`: **`noindex, nofollow`** |

BE có `GET /assets/slug/{slug}` — **FE không dùng**.

**Sai thiết kế:** Marketplace + `noindex` + không slug = **không share / không SEO organic**.

### 4.2 Nội dung trang

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| Full page, hero media | **Sheet drawer** | 🔴 Critical |
| GIF / video preview | Chỉ ảnh tĩnh | 🟠 Major |
| File list (tên, size, format) | BE trả `Files[]`; FE **không render** | 🟠 Major |
| License block riêng | Gộp vào bullet kỹ thuật | 🟠 Major |
| Related assets | 3 asset cùng category trong page hiện tại | 🟠 Major |
| Creator → storefront | Text `by {author}`, **không link** | 🔴 Critical |

### 4.3 Reviews

| itch.io | AssetBox |
|---------|----------|
| Rating + comments, sort, helpful | `AssetReviewsPanel` — CRUD cơ bản | 🟡 Minor — thiếu histogram, sort review |

### Điểm Product page

| | itch.io | AssetBox |
|--|---------|----------|
| **Điểm** | ~90/100 | ~20/100 |

---

## 5. Creator / Seller — Kinh tế người bán

**File chính:** `AddAsset.tsx`, `AdminDashboard.tsx`, `BE/.../AssetService.cs`

| Tiêu chí itch.io | AssetBox | Gap |
|------------------|----------|-----|
| Self-publish (mod nhẹ) | `PendingReview` → admin duyệt | 🟠 Major |
| Creator hub “Upload” công khai | `/add-asset` protected, back về `/admin` | 🟠 Major |
| Storefront creator | **Không có** | 🔴 Critical |
| `GET /assets/me` | BE có, **FE không có UI** | 🔴 Critical |
| Pricing USD / PWYW | Chỉ free / paid **bằng xu** | 🔴 Critical |
| Payout Stripe / PayPal | **Không có** | 🔴 Critical |
| Seller analytics | Chỉ admin analytics | 🔴 Critical |
| Download keys (press / backer) | Không | 🟠 Major |
| Widget embed | Không | 🟡 Minor |

**Sai mô hình:** itch.io = platform phục vụ **seller**. AssetBox = platform phục vụ **buyer + AI**, seller là phụ (curated catalog).

### Điểm Creator economy

| | itch.io | AssetBox |
|--|---------|----------|
| **Điểm** | ~95/100 | ~10/100 |

---

## 6. Buyer — Mua, thư viện, tin cậy

**File chính:** `AssetsCheckout.tsx`, `MyAssets.tsx`, `OrderService.cs`

### 6.1 Thanh toán

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| USD trực tiếp / PWYW | **Xu** (CK VND nạp xu / subscription) | 🔴 Critical (vs itch) |
| Stripe / PayPal global | Không gateway quốc tế cho asset | 🔴 Critical |
| Refund | Enum có; **không flow UI/API** | 🟠 Major |

**Naming confusing:** Cart DTO dùng `lineTotalVnd` trong khi giá asset thực tế là **xu**.

**USP AssetBox (không phải itch):** CK VND + gói sinh viên 29k — phù hợp VN.

### 6.2 Thư viện (`MyAssets.tsx`)

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| Library + re-download | Có signed URL, re-download | 🟡 OK |
| Organize collections | Search + **category hardcode** | 🟠 Major |

**Bug:** Categories hardcode (“2D Characters”, “UI/UX”…) **không khớp** `categoryName` API → filter có thể sai / trống.

### 6.3 Trust trên card

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| Stars + **review count** | Chỉ rating avg; `ratingCount` API có, UI không hiện | 🟠 Major |
| Verified creator | Không | 🟠 Major |
| Download count | Có | 🟡 OK |
| Sale badge | Không | 🔴 Critical |

### Điểm Buyer

| | itch.io | AssetBox |
|--|---------|----------|
| **Điểm** | ~90/100 | ~40/100 |

---

## 7. Community & retention

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| Follow creator | Không | 🔴 Critical |
| Comments / discussion | Chỉ review 1–5 sao | 🟠 Major |
| Game jams | Không | 🔴 Critical |
| Devlogs | Không | 🔴 Critical |

itch.io giữ user qua **creator relationship**; AssetBox qua **AI + subscription** — khác hẳn segment.

| | itch.io | AssetBox |
|--|---------|----------|
| **Điểm** | ~90/100 | ~5/100 |

---

## 8. Homepage & curation

**File:** `Home.tsx`

| itch.io | AssetBox | Gap |
|---------|----------|-----|
| Sale events, featured rows | Top 3 `downloadCount` | 🟠 Major |
| Real metrics | Stats hardcode (“500+ users”, “98%”) | 🟠 Major — trust issue |
| Featured API | BE có `featured=true` — **Home không dùng** | 🟠 Major |

---

## 9. Bảng điểm tổng hợp

**Chuẩn itch.io = 100.** Gap: 🔴 Critical · 🟠 Major · 🟡 Minor

| Hạng mục | itch.io | AssetBox | Ghi chú |
|----------|---------|----------|---------|
| Discovery / filter / sort | 95 | **25** | Sort hardcode, filter nghèo |
| Trang asset / SEO | 90 | **20** | noindex + drawer + no slug |
| Creator economy | 95 | **10** | Không payout, không storefront |
| Thanh toán asset | 90 | **30** | Xu-only, no refund |
| Thư viện buyer | 85 | **55** | Tải lại OK, organize yếu |
| Trust / social proof | 85 | **45** | Thiếu review count, verified |
| Community | 90 | **5** | Gần như không có |
| Admin / moderation | 70 | **75** | AssetBox mạnh hơn ở duyệt nội bộ |
| AI / GDD *(ngoài itch)* | 0 | **80** | USP riêng |
| Thị trường VN / VND *(ngoài itch)* | 20 | **70** | USP riêng |

**Tổng marketplace thuần (không tính AI / VN): AssetBox ~25–35/100 so với itch.io.**

---

## 10. Danh sách sai / thiếu (ưu tiên sửa)

### 🔴 Critical — sai thiết kế marketplace

| # | Vấn đề | Chi tiết |
|---|--------|----------|
| 1 | `noindex, nofollow` | `FE/.../index.html` — chặn SEO & share |
| 2 | Không trang asset slug | BE `GET /assets/slug/{slug}` — FE dùng `?details=uuid` |
| 3 | Sort cố định `createdAt` | `AssetsMarketplace.tsx` L89–90 — BE đã support sort khác |
| 4 | Không creator storefront | Không link author, không `/creator/:id` |
| 5 | Không seller economy | Không USD, PWYW, payout |
| 6 | Không bundle / sale | Conversion itch.io chủ yếu từ sale events |
| 7 | Chi tiết = drawer | Không phải product page — kém convert |

### 🟠 Major — BE có, FE chưa dùng / UX yếu

| # | Vấn đề |
|---|--------|
| 8 | Filter engine / style / tag trên marketplace |
| 9 | File list trước mua (BE trả, FE không hiện) |
| 10 | `ratingCount` không hiện trên card |
| 11 | Upload UX gắn admin; không có “Asset của tôi” |
| 12 | Related assets heuristic yếu |
| 13 | `MyAssets` category filter hardcode sai |
| 14 | Home không dùng `featured`; stats hardcode |
| 15 | Không preview GIF / video |
| 16 | Không refund flow |

### 🟡 Minor — chấp nhận giai đoạn đầu

- Pagination OK
- Bookmark ≈ wishlist cơ bản
- Reviews CRUD cơ bản
- Admin moderation OK
- Re-download thư viện OK

---

## 11. Điểm mạnh AssetBox (ngoài itch.io)

Không nên bỏ khi “giống itch.io hơn”:

1. **AI Chat Advisor** — phân tích ý tưởng game, gợi ý asset, export GDD
2. **Gói sinh viên 29k/tháng** — pricing VND, phù hợp thị trường VN
3. **Curated quality** — admin duyệt asset, catalog kiểm soát được
4. **Luồng mua end-to-end** — marketplace → cart → checkout xu → thư viện → download
5. **Upload pipeline thật** — Supabase signed URL, zip + images
6. **Tiếng Việt end-to-end**

---

## 12. Roadmap gợi ý

### Phase 1 — Sửa sai nhanh (giữ mô hình xu + AI)

- [ ] Bỏ `noindex` trên production (giữ noindex chỉ dev nếu cần)
- [ ] Route `/asset/:slug` + dùng `GET /assets/slug/{slug}`
- [ ] Dropdown sort: Popular (`downloadCount`), Top rated, Mới nhất, Giá
- [ ] Tag filter + clickable tags
- [ ] Hiện `ratingCount` trên card
- [ ] Render file list trong drawer / trang asset
- [ ] Home dùng `featured=true`; bỏ stats hardcode
- [ ] Sửa category filter `MyAssets` lấy từ API

### Phase 2 — Marketplace thật hơn

- [ ] Full page asset (không chỉ drawer)
- [ ] Trang creator `/creator/:userId`
- [ ] UI “Asset của tôi” (`GET /assets/me`)
- [ ] Preview GIF / video trên upload
- [ ] API related assets (tag / category)

### Phase 3 — Gần itch.io economy (đổi business model)

- [ ] Seller payout
- [ ] PWYW / fixed VND cho asset (ngoài xu)
- [ ] Bundle / sale campaign
- [ ] Follow creator

**Nguyên tắc:** Lấy **Discovery + Product page + Creator page** từ itch.io; **giữ AI + subscription + VN** làm USP.

---

## 13. File liên quan trong repo

| Vai trò | Path |
|---------|------|
| Marketplace UI | `FE/AssetServiceInterfaceDesign/src/app/components/AssetsMarketplace.tsx` |
| Home | `FE/AssetServiceInterfaceDesign/src/app/components/Home.tsx` |
| Checkout asset | `FE/AssetServiceInterfaceDesign/src/app/components/AssetsCheckout.tsx` |
| Thư viện | `FE/AssetServiceInterfaceDesign/src/app/components/MyAssets.tsx` |
| Upload | `FE/AssetServiceInterfaceDesign/src/app/components/AddAsset.tsx` |
| Reviews | `FE/AssetServiceInterfaceDesign/src/app/components/AssetReviewsPanel.tsx` |
| SEO | `FE/AssetServiceInterfaceDesign/index.html` |
| API assets | `FE/AssetServiceInterfaceDesign/src/api/assets.ts` |
| Types | `FE/AssetServiceInterfaceDesign/src/api/types/marketplace.ts` |
| BE list/sort | `BE/Repositories/Marketplace/AssetRepository.cs` |
| BE DTO | `BE/DTOs/Marketplace/AssetDtos.cs` |
| BE mua asset | `BE/Services/OrderService.cs` |
| BE assets API | `BE/Controllers/V1/AssetsController.cs` |

---

## Tham khảo

- [itch.io Game Assets](https://itch.io/game-assets)
- [itch.io Creator FAQ](https://itch.io/docs/creators/faq)
- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) — business model AssetBox
- [FE_BE_API_BACKLOG.md](./FE_BE_API_BACKLOG.md) — backlog API
