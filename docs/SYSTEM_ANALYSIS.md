# TÀI LIỆU PHÂN TÍCH HỆ THỐNG

# AI GAME ASSET MARKETPLACE & UNITY INTEGRATION PLATFORM

---

# 1. GIỚI THIỆU DỰ ÁN

## 1.1 Tên hệ thống

**AI-Powered Game Asset Marketplace & Unity Workflow Platform**

---

## 1.2 Mục tiêu hệ thống

Xây dựng một nền tảng tích hợp:

- AI Game Design Advisor
- Marketplace phân phối Asset Game
- Unity Editor Plugin
- Token Economy (Ví Xu)
- Subscription System
- Admin Dashboard

**Mục tiêu chính:**

- Giúp Indie Dev bắt đầu làm game nhanh hơn.
- Tự động hóa quy trình tìm kiếm asset.
- Hỗ trợ thiết kế gameplay bằng AI.
- Tích hợp workflow trực tiếp trong Unity.
- Tối ưu chi phí AI bằng cơ chế Credit/Xu.

---

# 2. PHÂN TÍCH BÀI TOÁN

## 2.1 Problem Statements

### P-01 — Người mới không biết bắt đầu gameplay

**Vấn đề:**

- Không biết xây gameplay loop.
- Không biết bắt đầu mechanics.
- Không biết roadmap.

**Giải pháp:**

AI Advisor tự động:

- Sinh Mini-GDD.
- Đề xuất gameplay loop.
- Đề xuất mechanics.
- Sinh roadmap.

---

### P-02 — Asset không đồng bộ art style

**Vấn đề:**

- Asset tải từ nhiều nguồn.
- Mismatch visual.
- Không đồng bộ phong cách.

**Giải pháp:**

AI semantic mapping:

- Phân tích art style.
- Recommend asset tương thích.
- Tagging theo visual style.

---

### P-03 — Tìm asset quá tốn thời gian

**Vấn đề:**

- Asset phân tán.
- Khó kiểm định.
- Search thủ công.

**Giải pháp:**

Marketplace tập trung:

- Semantic Search.
- AI Asset Recommendation.
- Metadata chuẩn hóa.

---

### P-04 — AI hiện tại chỉ trả text

**Vấn đề:**

- AI không linked database.
- Không có workflow thực tế.

**Giải pháp:**

AI + Asset Database:

- AI phân tích context.
- Tự query asset.
- Hiển thị asset realtime.

---

### P-05 — Import asset vào Unity phức tạp

**Vấn đề:**

- Sai folder structure.
- Import lỗi.
- Dependency conflict.

**Giải pháp:**

Unity Plugin:

- One-click import.
- Auto extract.
- Auto move Assets.

---

### P-06 — AI API cost cao

**Vấn đề:**

- Token rất đắt.
- Dễ spam.

**Giải pháp:**

Wallet & Tokenomics:

- Ví Xu.
- Credit limit.
- Queue priority.

---

### P-07 — Admin khó kiểm soát hệ thống

**Vấn đề:**

- Không monitor token.
- Không quản lý asset tốt.

**Giải pháp:**

Admin Dashboard:

- Analytics.
- AI monitoring.
- Asset moderation.
- Revenue tracking.

---

# 3. KIẾN TRÚC TỔNG THỂ

## 3.1 System Architecture

```text
Client Layer
 ├── Web Frontend
 ├── Unity Plugin
 └── Admin Dashboard

API Gateway
 ├── Auth Service
 ├── AI Service
 ├── Marketplace Service
 ├── Wallet Service
 ├── Payment Service
 └── Analytics Service

Infrastructure
 ├── PostgreSQL
 ├── Redis
 ├── Vector Database
 ├── AWS S3
 └── AI Providers
```

---

# 4. PHÂN TÍCH ROLE

## 4.1 Guest User

### Mô tả

Người dùng chưa đăng nhập.

### Quyền hạn

| Chức năng      | Quyền |
| -------------- | ----- |
| Browse Asset   | YES   |
| Search Asset   | YES   |
| Filter Asset   | YES   |
| Download Asset | NO    |
| AI Chat        | NO    |
| Bookmark       | NO    |
| Wallet         | NO    |

### User Flow

```text
Landing Page
   ↓
Marketplace
   ↓
Asset Detail
   ↓
Login/Register
```

---

## 4.2 Free User

### Mô tả

Người dùng miễn phí có ví Xu.

### Quyền hạn

| Chức năng      | Quyền   |
| -------------- | ------- |
| AI Chat        | YES     |
| Download Asset | YES     |
| Wallet         | YES     |
| Bookmark       | YES     |
| Unity Plugin   | YES     |
| Advanced AI    | LIMITED |

### Giới hạn

| Feature        | Limit   |
| -------------- | ------- |
| Daily AI Calls | Limited |
| AI Model       | Basic   |
| Queue Priority | Low     |

---

## 4.3 Premium User

### Mô tả

Người dùng trả phí.

### Quyền hạn

| Chức năng          | Quyền        |
| ------------------ | ------------ |
| GPT-4o / Claude    | YES          |
| Fast Queue         | YES          |
| Unlimited AI       | Higher Limit |
| Team Workspace     | YES          |
| Advanced Analytics | YES          |

---

## 4.4 Admin

### Mô tả

Quản trị viên hệ thống.

### Quyền hạn

| Chức năng         | Quyền |
| ----------------- | ----- |
| Manage Users      | YES   |
| Manage Assets     | YES   |
| Manage Pricing    | YES   |
| AI Monitoring     | YES   |
| Revenue Dashboard | YES   |
| Ban User          | YES   |

---

# 5. MODULE PHÂN TÍCH CHI TIẾT

## 5.1 Authentication Module

### Chức năng

- Register
- Login
- OAuth
- JWT
- Refresh Token
- API Token

### Login Methods

| Method | Support |
| ------ | ------- |
| Email  | YES     |
| Google | YES     |
| GitHub | YES     |

### API Endpoints

| Endpoint       | Method | Description   |
| -------------- | ------ | ------------- |
| /auth/register | POST   | Register      |
| /auth/login    | POST   | Login         |
| /auth/google   | POST   | Google OAuth  |
| /auth/github   | POST   | GitHub OAuth  |
| /auth/refresh  | POST   | Refresh token |

---

## 5.2 Wallet System

### Chức năng

- Quản lý xu.
- Trừ xu AI.
- Nạp xu.
- Transaction history.

### Wallet Flow

```text
AI Request
   ↓
Check Wallet
   ↓
Enough Balance?
 ├── YES → Deduct Xu
 └── NO → Payment Popup
```

### Transaction Types

| Type     | Description |
| -------- | ----------- |
| AI_USAGE | Trừ AI      |
| PURCHASE | Nạp xu      |
| REFUND   | Hoàn xu     |
| BONUS    | Tặng xu     |

---

## 5.3 AI Advisor Module

### Core Feature

Đây là module quan trọng nhất.

### Workflow

```text
User Prompt
   ↓
Prompt Processor
   ↓
LLM API
   ↓
Structured Output
   ↓
Semantic Mapping
   ↓
Asset Recommendation
```

### AI Output Structure

#### Core Gameplay

Ví dụ:

- Combat loop
- Resource management
- Quest system

#### Mechanics

Ví dụ:

- Dodge roll
- Combo attack
- Crafting

#### Art Style

Ví dụ:

- Pixel Art
- Low Poly
- Anime Stylized

#### Roadmap

Ví dụ:

- Prototype
- Vertical Slice
- MVP
- Production

### Semantic Mapping

AI phân tích:

| AI Extract   | Query Database     |
| ------------ | ------------------ |
| Pixel Art    | Filter asset style |
| RPG          | Filter genre       |
| Sword Combat | Query animation    |
| Horror       | Query audio        |

### AI Session Features

| Feature        | Description |
| -------------- | ----------- |
| Save Session   | Lưu chat    |
| Rename Session | Đổi tên     |
| Delete Session | Xóa         |
| Export GDD     | Export file |

---

## 5.4 Marketplace Module

### Chức năng

- Browse asset.
- Search.
- Filter.
- Preview.
- Download.
- Bookmark.
- Rating.

### Asset Categories

| Category  |
| --------- |
| 2D        |
| 3D        |
| Audio     |
| UI        |
| Animation |
| VFX       |
| Shader    |
| Template  |

### Advanced Filter

| Filter        | Description    |
| ------------- | -------------- |
| Genre         | RPG/Casual     |
| Art Style     | Pixel/Low Poly |
| Unity Version | 2021/2022      |
| Tags          | Multiple       |
| Free/Paid     | Pricing        |

### Asset Detail Features

| Feature       | Description   |
| ------------- | ------------- |
| Gallery       | Image slider  |
| Audio Preview | Audio player  |
| 3D Preview    | WebGL Viewer  |
| Tags          | Metadata      |
| Reviews       | Rating        |
| Compatibility | Unity version |

---

## 5.5 Unity Plugin Module

### Mục tiêu

Tích hợp hệ thống trực tiếp vào Unity Editor.

### Features

| Feature       | Description      |
| ------------- | ---------------- |
| AI Chat       | Chat AI          |
| Wallet Sync   | Sync xu          |
| Browse Assets | Browse           |
| Import Asset  | One-click import |
| Session Sync  | Đồng bộ          |

### Plugin Workflow

```text
Unity Editor
   ↓
Plugin Window
   ↓
API Gateway
   ↓
Backend Services
```

### One-click Import Flow

```text
Select Asset
   ↓
Download Signed URL
   ↓
Extract Package
   ↓
Move Into /Assets/
   ↓
Refresh Asset Database
```

---

## 5.6 Payment Module

### Chức năng

- Mua xu.
- Subscription.
- Invoice.
- Payment history.

### Pricing Plans

| Plan       | Description   |
| ---------- | ------------- |
| Free       | Basic         |
| Pro        | Advanced AI   |
| Enterprise | Team solution |

### Payment Flow

```text
Select Plan
   ↓
Checkout
   ↓
Payment Gateway
   ↓
Webhook
   ↓
Update Wallet
```

---

## 5.7 Admin Dashboard

### Features

#### User Management

- Search users.
- Ban/unban.
- Edit balance.
- View usage.

#### Asset Moderation

- Upload asset.
- Approve asset.
- Reject asset.
- Edit metadata.

#### AI Monitoring

- Token usage.
- Cost tracking.
- Model routing.

#### Revenue Dashboard

- Subscription revenue.
- Xu purchase.
- Daily income.

---

# 6. DATABASE DESIGN

## 6.1 USERS TABLE

```sql
users
- id
- username
- email
- password_hash
- role
- avatar_url
- status
- created_at
- updated_at
```

---

## 6.2 WALLETS TABLE

```sql
wallets
- id
- user_id
- balance
- updated_at
```

---

## 6.3 WALLET_TRANSACTIONS TABLE

```sql
wallet_transactions
- id
- wallet_id
- type
- amount
- description
- created_at
```

---

## 6.4 ASSETS TABLE

```sql
assets
- id
- title
- slug
- description
- category_id
- uploader_id
- art_style
- asset_type
- price_xu
- thumbnail_url
- status
- created_at
```

---

## 6.5 ASSET_FILES TABLE

```sql
asset_files
- id
- asset_id
- file_url
- unity_version
- file_size
- checksum
```

---

## 6.6 TAGS TABLE

```sql
tags
- id
- name
```

---

## 6.7 ASSET_TAGS TABLE

```sql
asset_tags
- asset_id
- tag_id
```

---

## 6.8 AI_SESSIONS TABLE

```sql
ai_sessions
- id
- user_id
- title
- model_used
- total_tokens
- created_at
```

---

## 6.9 AI_MESSAGES TABLE

```sql
ai_messages
- id
- session_id
- role
- content
- token_used
- created_at
```

---

## 6.10 SUBSCRIPTIONS TABLE

```sql
subscriptions
- id
- user_id
- plan_id
- status
- started_at
- expired_at
```

---

# 7. ERD RELATIONSHIP

```text
USERS
 ├── WALLETS
 │      └── WALLET_TRANSACTIONS
 │
 ├── AI_SESSIONS
 │      └── AI_MESSAGES
 │
 ├── SUBSCRIPTIONS
 │
 ├── DOWNLOADS
 │
 ├── BOOKMARKS
 │
 └── PAYMENTS

ASSETS
 ├── ASSET_FILES
 ├── ASSET_IMAGES
 ├── REVIEWS
 ├── TAGS
 └── CATEGORIES
```

---

# 8. PHÂN TÍCH UI/UX TỪNG TRANG

## 8.1 Landing Page

### Sections

#### Hero Banner

- CTA Start Building Game
- CTA Try AI

#### Trending Assets

- Popular assets
- Free assets

#### AI Showcase

- Mini-GDD demo
- Asset recommendation demo

#### Pricing

- Free/Pro/Enterprise

#### Plugin Showcase

- Unity plugin preview

---

## 8.2 Marketplace Page

### Layout

```text
Sidebar Filters | Asset Grid
```

### Components

| Component      | Description |
| -------------- | ----------- |
| Search Bar     | Search      |
| Filter Sidebar | Filter      |
| Sort Dropdown  | Sorting     |
| Asset Card     | Preview     |
| Pagination     | Pages       |

---

## 8.3 Asset Detail Page

### Sections

| Section        | Description |
| -------------- | ----------- |
| Gallery        | Images      |
| Description    | Content     |
| Tags           | Metadata    |
| Reviews        | Rating      |
| Download       | Download    |
| Related Assets | Suggestion  |

---

## 8.4 AI Workspace

### Layout

```text
---------------------------------
| Sessions | Chat Window        |
---------------------------------
| Asset Recommendation Panel    |
---------------------------------
```

### Features

- Prompt input.
- AI structured output.
- Asset suggestion.
- Session save.

---

## 8.5 Wallet Page

### Features

- Current balance.
- Buy credits.
- Transaction history.
- Usage chart.

---

## 8.6 Admin Dashboard

### Widgets

| Widget     | Description  |
| ---------- | ------------ |
| Revenue    | Income       |
| AI Cost    | Cost         |
| DAU        | Active users |
| Top Assets | Popular      |
| AI Usage   | Token usage  |

---

# 9. BACKEND ARCHITECTURE

## Recommended Stack

| Layer     | Technology      |
| --------- | --------------- |
| Frontend  | Next.js         |
| Backend   | NestJS          |
| Database  | PostgreSQL      |
| Cache     | Redis           |
| Storage   | AWS S3          |
| Vector DB | Pinecone/Qdrant |
| AI        | OpenAI/Claude   |
| Auth      | JWT/OAuth       |

---

# 10. SECURITY

## Security Features

| Feature    | Description     |
| ---------- | --------------- |
| JWT        | Authentication  |
| Signed URL | Secure download |
| Rate Limit | Anti spam       |
| Role Guard | Authorization   |
| Audit Logs | Monitoring      |

---

# 11. SCALABILITY

## Future Expansion

- Unreal Engine Plugin.
- Blender Plugin.
- Team collaboration.
- AI asset generation.
- Community marketplace.
- Revenue sharing.

---

# 12. BUSINESS MODEL

## Revenue Streams

| Revenue         | Description   |
| --------------- | ------------- |
| Subscription    | Monthly       |
| Xu Purchase     | Credit system |
| Enterprise      | Team package  |
| Featured Assets | Promotion     |

---

# 13. ĐIỂM KHÁC BIỆT HỆ THỐNG

| Traditional Asset Store | Your System        |
| ----------------------- | ------------------ |
| Manual Search           | AI Semantic Search |
| Asset only              | AI + Asset         |
| No gameplay support     | Gameplay advisor   |
| No workflow integration | Unity workflow     |
| No AI routing           | Premium AI routing |

---

# 14. KẾT LUẬN

Đây không đơn thuần là một Asset Marketplace.

Mà là:

**AI-assisted Game Development Ecosystem**

Hệ thống giải quyết toàn bộ pipeline:

- Ideation
- Design
- Asset Discovery
- Workflow Integration
- Production Support
- AI Assistance

trong cùng một nền tảng.
