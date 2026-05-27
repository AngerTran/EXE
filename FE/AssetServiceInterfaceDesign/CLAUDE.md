# Game Assets AI Platform - Design System & Codebase Guide

## Tổng Quan Dự Án

Platform AI hỗ trợ game developers tìm kiếm và quản lý assets, với hệ thống AI chat để phân tích ý tưởng game và gợi ý assets phù hợp.

**Tech Stack:**
- React 18 + TypeScript
- React Router v7
- Tailwind CSS 4.x
- Vite
- localStorage cho persistence

**Ngôn ngữ:** Tiếng Việt (UI và content)

---

## Design System

### Aesthetic: Kinetic Tech Dark

Giao diện tối hiện đại với điểm nhấn màu sắc sống động, tạo cảm giác chuyên nghiệp và công nghệ cao.

### Design Tokens

Tất cả tokens được định nghĩa trong `src/styles/theme.css` và map tới Tailwind classes qua `src/styles/index.css`.

#### Color Palette

```css
/* Primary Colors */
--background: #0a0e1a;          /* Nền chính - dark navy */
--foreground: #f8f9fa;          /* Text chính - gần trắng */
--card: #0f172a;                /* Card backgrounds */
--border: #1e293b;              /* Borders */

/* Brand Colors */
--primary: #00d9ff;             /* Cyan - điểm nhấn chính */
--primary-foreground: #0a0e1a;  /* Text trên primary */
--secondary: #a855f7;           /* Purple - điểm nhấn phụ */
--secondary-foreground: #f8f9fa;

/* Semantic Colors */
--success: #10b981;             /* Green - thành công */
--warning: #f59e0b;             /* Amber - cảnh báo */
--destructive: #ec4899;         /* Pink - nguy hiểm/xóa */
--muted: #64748b;               /* Gray - text phụ */
--muted-foreground: #94a3b8;
```

#### Typography

**Fonts (Google Fonts):**
```css
/* Display - Headings, titles */
font-family: 'Space Grotesk', sans-serif;
font-weight: 500 | 600 | 700;

/* Body - Content, descriptions */
font-family: 'Inter', sans-serif;
font-weight: 400 | 500 | 600;

/* Mono - Code, numbers, IDs */
font-family: 'JetBrains Mono', monospace;
font-weight: 400 | 500;
```

**Scale:**
- Headings: text-4xl/5xl/6xl (hero), text-2xl/3xl (sections)
- Body: text-base (16px), text-sm (14px), text-xs (12px)
- Luôn dùng font-mono cho: giá tiền, số credits, IDs, timestamps

#### Spacing & Layout

```css
/* Container Max Width */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Card Padding */
p-6 (mobile) | p-8 (desktop)

/* Grid Gaps */
gap-6 (cards) | gap-4 (forms) | gap-2 (buttons)

/* Border Radius */
rounded-lg (8px) | rounded-xl (12px) | rounded-2xl (16px)
```

#### Motion & Effects

**Glow Effects:**
```css
/* Primary hover glow */
hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]
hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] /* stronger */

/* Button active glow */
shadow-[0_0_30px_rgba(0,217,255,0.5)]

/* Progress bar glow */
shadow-[0_0_10px_rgba(0,217,255,0.5)]
```

**Transitions:**
```css
transition-all          /* Cho hover states */
transition-colors       /* Cho text/bg color changes */
transition-transform    /* Cho scale effects */
```

**Hover States:**
```css
hover:scale-105         /* Cards */
hover:scale-110         /* Buttons */
hover:border-primary/50 /* Borders */
hover:bg-card/80        /* Backgrounds */
```

---

## Component Patterns

### Buttons

**Primary CTA:**
```tsx
className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
```

**Secondary:**
```tsx
className="bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-6 py-3 rounded-lg transition-all"
```

### Cards

**Standard Card:**
```tsx
className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all"
```

### Badges

**Status Badges:**
```tsx
{/* Success */}
<span className="px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success">
  Hoàn thành
</span>

{/* Warning */}
<span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning">
  Đang xử lý
</span>

{/* Destructive */}
<span className="px-3 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive">
  Đã hủy
</span>
```

### Form Inputs

```tsx
className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
```

### Icons

- Sử dụng `lucide-react`
- Size: w-4 h-4 (small), w-5 h-5 (default), w-6 h-6 (large)
- Color: text-primary, text-secondary, text-success, text-warning, text-destructive

---

## Cấu Trúc Dự Án

```
src/
├── app/
│   ├── App.tsx                    # Main app với routing
│   ├── components/
│   │   ├── Root.tsx              # Layout + Navigation
│   │   ├── Home.tsx              # Trang chủ
│   │   ├── Auth.tsx              # Đăng nhập/đăng ký
│   │   ├── Dashboard.tsx         # AI Chat interface
│   │   ├── AssetsMarketplace.tsx # Marketplace + Cart
│   │   ├── Pricing.tsx           # Gói dịch vụ
│   │   ├── MyAssets.tsx          # Quản lý assets đã mua
│   │   └── AdminDashboard.tsx    # Admin panel
│   └── contexts/
│       └── AuthContext.tsx       # Auth + Credits management
└── styles/
    ├── fonts.css                 # Google Fonts imports
    ├── theme.css                 # Design tokens
    └── index.css                 # Tailwind config + mappings
```

---

## Data Models

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin";
  credits: number;              // Xu AI (10 xu miễn phí ban đầu)
  subscription?: "student" | "indie" | "pro";
  registeredAt: string;
  totalSpent: number;
}
```

**localStorage key:** `users` (object with email as key)

### Asset

```typescript
interface Asset {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  isFree: boolean;
  imageUrl?: string;
  author?: string;
  description?: string;
}
```

**localStorage keys:**
- `admin_assets` - All assets (admin management)
- `cart_items` - Current cart items
- `purchased_assets` - User's purchased assets

### Chat Message

```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  suggestions?: string[];
}
```

**localStorage key:** `chat_history`

---

## Hệ Thống Credits (Xu)

**Terminology:** "xu" (không phải "lượt")

**Pricing:**
- **FREE**: 10 xu miễn phí khi đăng ký
- **STUDENT**: 29,000đ/tháng - 100 xu
- **INDIE**: 99,000đ/tháng - Unlimited ∞
- **PRO**: 199,000đ/tháng - Unlimited ∞

**Usage:**
- 1 xu = 1 câu hỏi AI chat
- Credits display: `<Coins className="w-4 h-4" /> {credits} xu`
- Warning khi < 5 xu: text-warning color

---

## Routing Structure

```tsx
Routes = [
  { path: "/", component: Home },
  { path: "/auth", component: Auth },
  { path: "/dashboard", component: Dashboard },      // Protected
  { path: "/marketplace", component: AssetsMarketplace },
  { path: "/pricing", component: Pricing },
  { path: "/my-assets", component: MyAssets },       // Protected
  { path: "/admin", component: AdminDashboard },     // Admin only
]
```

**Protected Routes:** Require user login
**Admin Routes:** Require role === "admin"

---

## Best Practices

### Styling

✅ **DO:**
- Dùng design tokens (`bg-background`, `text-foreground`)
- Dùng font-mono cho số tiền, credits, IDs
- Thêm hover glow effects cho interactive elements
- Dùng backdrop-blur-sm cho glass morphism
- Gradient primary→secondary cho CTAs chính

❌ **DON'T:**
- Hardcode colors (#00d9ff trực tiếp)
- Dùng inline styles
- Bỏ qua transitions/hover states
- Tạo custom CSS files mới

### Components

✅ **DO:**
- Export default cho page components
- Dùng functional components + hooks
- Tách logic phức tạp thành custom hooks
- localStorage sync trong useEffect
- Error boundaries cho admin features

❌ **DON'T:**
- Class components
- Inline function definitions trong JSX
- Direct DOM manipulation
- Bỏ qua loading/error states

### Vietnamese Language

✅ **DO:**
- Tất cả UI text bằng tiếng Việt
- Dùng "xu" thay vì "credits" trong UI
- Format số: `toLocaleString("vi-VN")`
- Dấu đ cho tiền: "29,000đ"

❌ **DON'T:**
- Mix English/Vietnamese trong cùng một sentence
- Dùng "lượt" thay vì "xu"
- Bỏ dấu tiếng Việt

---

## Mock Data & AI

**AI Chat:**
- Mock responses được generate trong `Dashboard.tsx`
- Simulate typing delay: 50ms per character
- Asset suggestions format: "🎨 [Asset Name] - [Category]"

**Admin Data:**
- Initial seed data trong `AdminDashboard.tsx`
- Revenue charts: 7 days mock data
- Package sales: Mock statistics

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
# → http://localhost:5173

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Common Tasks

### Add new page
1. Create component in `src/app/components/`
2. Add route in `src/app/App.tsx`
3. Add navigation link in `Root.tsx`
4. Use kinetic theme design tokens

### Add new design token
1. Add to `src/styles/theme.css`
2. Map to Tailwind class in `src/styles/index.css`
3. Use via className (e.g., `bg-new-token`)

### Modify color scheme
1. Update `--primary`, `--secondary` etc in `theme.css`
2. Colors auto-apply via existing class names
3. No need to touch component files

---

## References

- **Design Guidelines:** `guidelines/Guidelines.md`
- **Theme Tokens:** `src/styles/theme.css`
- **Tailwind Mapping:** `src/styles/index.css`
- **Auth Context:** `src/app/contexts/AuthContext.tsx`

---

**Last Updated:** 2024-02-25
**Version:** 1.0.0
