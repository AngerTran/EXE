# AssetBox

Platform AI giúp game developers tìm kiếm và quản lý assets, với AI chat để phân tích ý tưởng game và gợi ý assets phù hợp.

## ✨ Features

- 🤖 **AI Chat** - Phân tích ý tưởng game và gợi ý assets
- 🛒 **Assets Marketplace** - Tìm kiếm, filter, và mua assets
- 💳 **Credit System** - Hệ thống xu để sử dụng AI
- 📦 **Package Plans** - Gói Student, Indie, Pro
- 👤 **User Management** - Đăng ký, đăng nhập, quản lý assets
- 🛡️ **Admin Dashboard** - Quản lý users, assets, orders, packages

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Mở trình duyệt tại [http://localhost:5173](http://localhost:5173)

## 🎨 Design System

**Theme:** Kinetic Tech Dark - Giao diện tối hiện đại với điểm nhấn cyan/purple

**Colors:**
- Primary: `#00d9ff` (Cyan)
- Secondary: `#a855f7` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Destructive: `#ec4899` (Pink)

**Typography:**
- Display: Space Grotesk
- Body: Inter
- Mono: JetBrains Mono

**Xem chi tiết:** [CLAUDE.md](./CLAUDE.md) và [guidelines/Guidelines.md](./guidelines/Guidelines.md)

## 📁 Project Structure

```
src/
├── app/
│   ├── App.tsx                   # Main app + routing
│   ├── components/               # Page components
│   │   ├── Root.tsx             # Layout + Navigation
│   │   ├── Home.tsx             # Landing page
│   │   ├── Auth.tsx             # Login/Register
│   │   ├── Dashboard.tsx        # AI Chat
│   │   ├── AssetsMarketplace.tsx
│   │   ├── Pricing.tsx
│   │   ├── MyAssets.tsx
│   │   └── AdminDashboard.tsx
│   └── contexts/
│       └── AuthContext.tsx      # Auth + Credits
├── constants/
│   └── theme.ts                 # Design tokens
└── styles/
    ├── fonts.css                # Google Fonts
    ├── theme.css                # CSS variables
    └── index.css                # Tailwind config
```

## 💎 Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v7
- **Styling:** Tailwind CSS 4.x
- **Build:** Vite
- **Icons:** Lucide React
- **Charts:** Recharts
- **Storage:** localStorage

## 💰 Pricing Plans

| Gói | Giá | Credits | Features |
|-----|-----|---------|----------|
| **FREE** | 0đ | 10 xu | Gợi ý cơ bản, marketplace |
| **STUDENT** | 29,000đ/tháng | 100 xu | Assets miễn phí, AI chi tiết |
| **INDIE** | 99,000đ/tháng | ∞ Unlimited | Tư vấn 1h, review assets |
| **PRO** | 199,000đ/tháng | ∞ Unlimited | Team support, 3h tư vấn |

## 🔐 Demo Accounts

**Tất cả tài khoản demo đều có sẵn với 1 click tại trang `/auth`**

| Account | Email | Password | Credits | Description |
|---------|-------|----------|---------|-------------|
| 👤 **Admin** | admin@gameai.vn | admin123 | 999 | Full admin access |
| 🎓 **Student** | student@demo.vn | demo123 | 85 xu | Gói Student (29k/tháng) |
| ⚡ **Indie** | indie@demo.vn | demo123 | ∞ Unlimited | Gói Indie (99k/tháng) |
| 👑 **Pro** | pro@demo.vn | demo123 | ∞ Unlimited | Gói Pro (199k/tháng) |
| 🆓 **Free** | free@demo.vn | demo123 | 7 xu | Gói Free (low credits) |
| 👤 **User** | user@example.com | user123 | 45 xu | Generic user |

**💡 Tip:** Click icon copy tại trang login để auto-fill credentials!

**🔧 Cannot Login?** Run in browser console:
```javascript
window.debugStorage.resetAndSeed()
```

Xem chi tiết:
- [DEMO.md](./DEMO.md) - Testing guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Fix common issues

## 📝 Available Scripts

```bash
pnpm dev      # Start dev server (localhost:5173)
pnpm build    # Build for production
pnpm preview  # Preview production build
```

## 🎯 Key Features Detail

### AI Chat System
- Mock AI responses với typing animation
- Consume 1 xu per question
- Asset suggestions với category tags
- Chat history persistence (localStorage)

### Assets Marketplace
- Search + Filter (category, price, rating)
- Shopping cart với tính năng checkout
- Free và paid assets
- Download management

### Admin Dashboard
- User management (view, edit, delete)
- Asset management (CRUD operations)
- Orders tracking
- Package statistics với charts (Recharts)
- Real-time updates với localStorage sync

## 🌐 Routing

| Path | Component | Access |
|------|-----------|--------|
| `/` | Home | Public |
| `/auth` | Auth | Public |
| `/dashboard` | Dashboard | Protected |
| `/marketplace` | AssetsMarketplace | Public |
| `/pricing` | Pricing | Public |
| `/my-assets` | MyAssets | Protected |
| `/admin` | AdminDashboard | Admin only |

## 💾 Data Storage

**localStorage Keys:**
- `users` - User accounts
- `currentUser` - Logged in user email
- `cart_items` - Shopping cart
- `purchased_assets` - User's assets
- `chat_history` - AI chat messages
- `admin_assets` - All assets (admin)
- `admin_orders` - Order history
- `admin_packages` - Package data

## 🎨 Component Patterns

### Button Primary
```tsx
<button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]">
  Click Me
</button>
```

### Card
```tsx
<div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
  Content
</div>
```

### Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success">
  Success
</span>
```

## 🔧 Development Guidelines

### Styling
- ✅ Use design tokens (`bg-background`, `text-primary`)
- ✅ Use `font-mono` for numbers, prices, IDs
- ✅ Add hover glow effects
- ❌ Don't hardcode colors
- ❌ Don't use inline styles

### Code
- ✅ Functional components + hooks
- ✅ TypeScript interfaces
- ✅ localStorage sync in useEffect
- ❌ Don't use class components
- ❌ Don't inline functions in JSX

### Language
- ✅ All UI in Vietnamese
- ✅ Use "xu" not "credits"
- ✅ Format: `toLocaleString("vi-VN")`
- ❌ Don't mix English/Vietnamese

## 📚 Documentation

- **Design System:** [CLAUDE.md](./CLAUDE.md)
- **Design Guidelines:** [guidelines/Guidelines.md](./guidelines/Guidelines.md)
- **Theme Constants:** [src/constants/theme.ts](./src/constants/theme.ts)

## 🤝 Contributing

1. Follow design system in CLAUDE.md
2. Use existing component patterns
3. Test with both admin and customer accounts
4. Keep Vietnamese language consistent

## 📄 License

Private — AssetBox © 2026

---

**Version:** 1.0.0  
**Last Updated:** 2024-02-25  
**Language:** Vietnamese (Tiếng Việt)
