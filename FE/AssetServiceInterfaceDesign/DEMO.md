# 🎮 Demo Accounts - Quick Testing Guide

Danh sách tài khoản demo đã được tạo sẵn để test nhanh tất cả tính năng của platform.

---

## 📋 Demo Accounts List

### 1. 👤 Admin Account
**Full admin access - Quản trị toàn hệ thống**

```
Email:    admin@gameai.vn
Password: admin123
```

**Features:**
- ✅ Admin Dashboard với charts & analytics
- ✅ Quản lý Users (view, edit, delete)
- ✅ Quản lý Assets (CRUD operations)
- ✅ Quản lý Orders
- ✅ Quản lý Packages
- ✅ 999 xu (unlimited testing)

**Test scenario:**
- Login → Auto redirect to `/admin`
- View all users, edit credits, change roles
- Add/edit/delete assets in marketplace
- View revenue charts and statistics

---

### 2. 🎓 Student Account
**Gói Student - Phù hợp sinh viên**

```
Email:    student@demo.vn
Password: demo123
```

**Features:**
- ✅ 85 xu còn lại
- ✅ Subscription: STUDENT (29,000đ/tháng)
- ✅ AI Chat với gợi ý assets
- ✅ Full marketplace access
- ✅ Demo chat history có sẵn

**Test scenario:**
- Login → Dashboard có sẵn chat history
- Test AI chat (consume 1 xu/question)
- Browse marketplace và add to cart
- View My Assets

---

### 3. ⚡ Indie Account
**Gói Indie - Developer độc lập**

```
Email:    indie@demo.vn
Password: demo123
```

**Features:**
- ✅ ∞ Unlimited xu
- ✅ Subscription: INDIE (99,000đ/tháng)
- ✅ Unlimited AI chat
- ✅ 1 giờ tư vấn Mentor

**Test scenario:**
- Test unlimited credits feature
- AI chat không giới hạn
- Purchase assets và download

---

### 4. 👑 Pro Account
**Gói Pro - Team & Enterprise**

```
Email:    pro@demo.vn
Password: demo123
```

**Features:**
- ✅ ∞ Unlimited xu
- ✅ Subscription: PRO (199,000đ/tháng)
- ✅ Team support
- ✅ 3 giờ tư vấn chuyên gia
- ✅ Priority support 24/7

**Test scenario:**
- Test premium features
- Download high-quality assets
- Check priority support badge

---

### 5. 🆓 Free Account
**Gói Free - Dùng thử**

```
Email:    free@demo.vn
Password: demo123
```

**Features:**
- ⚠️ 7 xu còn lại (low credits warning)
- ✅ Subscription: FREE
- ✅ Basic AI suggestions
- ✅ Marketplace browsing

**Test scenario:**
- Test low credits warning (< 5 xu)
- Try to use AI chat
- View upgrade prompts
- Navigate to Pricing page

---

### 6. 👤 Generic User Account
**Customer account thông thường**

```
Email:    user@example.com
Password: user123
```

**Features:**
- ✅ 45 xu
- ✅ Subscription: STUDENT
- ✅ Normal user experience

---

## 🚀 Quick Demo Flow

### Flow 1: Customer Journey (Student)
```
1. Go to /auth
2. Click copy icon on "🎓 Student Account"
3. Login → Dashboard
4. Try AI chat: "Tôi muốn làm game RPG, cần gì?"
5. Go to Marketplace
6. Add some assets to cart
7. Checkout
8. View My Assets
```

### Flow 2: Admin Operations
```
1. Login as admin@gameai.vn
2. View Admin Dashboard
3. Check all statistics and charts
4. Go to Users tab → Edit a user's credits
5. Go to Assets tab → Add a new asset
6. Go to Orders tab → Manage orders
7. Go to Packages tab → View package sales
```

### Flow 3: Free User Upgrade Path
```
1. Login as free@demo.vn
2. Notice low credits warning (7 xu < 5 threshold)
3. Try to use AI chat
4. Navigate to Pricing page
5. Compare packages
6. Select STUDENT package
7. Checkout flow
```

---

## 💡 Testing Features

### ✅ Auth & Navigation
- [x] Login with demo accounts
- [x] Auto-fill credentials with copy button
- [x] Role-based redirect (admin → /admin, customer → /dashboard)
- [x] Protected routes
- [x] Logout functionality

### ✅ AI Chat System
- [x] Send questions (consume 1 xu)
- [x] Typing animation
- [x] Asset suggestions with emoji
- [x] Chat history persistence
- [x] Credits counter updates
- [x] Low credits warning

### ✅ Marketplace
- [x] Search assets
- [x] Filter by category/price/rating
- [x] Add to cart
- [x] Cart management
- [x] Checkout process
- [x] Free vs Paid assets

### ✅ My Assets
- [x] View purchased assets
- [x] Search & filter owned assets
- [x] Download with progress bar
- [x] Download history

### ✅ Admin Dashboard
- [x] Overview statistics
- [x] Revenue charts (Recharts)
- [x] User management (CRUD)
- [x] Asset management (CRUD)
- [x] Order management
- [x] Package statistics

### ✅ Credits System
- [x] Display "xu" terminology
- [x] Unlimited credits (∞) for INDIE/PRO
- [x] Warning when < 5 xu
- [x] Consume on AI chat usage
- [x] Package-based credits

---

## 🎯 Demo Scenarios

### Scenario 1: New Developer Discovery
**Persona:** Student learning game dev

1. Register new account (gets 10 free xu)
2. Use AI to ask about platformer game assets
3. Browse marketplace based on AI suggestions
4. Add 2-3 free assets to cart
5. Checkout and download
6. Return to AI for more questions about implementation

### Scenario 2: Experienced Developer
**Persona:** Indie dev with specific needs

1. Login as indie@demo.vn (unlimited xu)
2. Ask detailed questions about specific asset types
3. Purchase premium assets
4. Download and integrate into project
5. Return for consultation questions

### Scenario 3: Admin Management
**Persona:** Platform administrator

1. Login as admin
2. Review daily statistics
3. Edit a user's credits (customer support)
4. Add new asset to marketplace
5. Approve/reject pending orders
6. Monitor revenue charts

---

## 📊 Data Pre-seeded

### Users
- 6 demo accounts (1 admin, 5 customers)
- Various subscription levels
- Different credit balances
- Realistic registration dates

### Chat History
- Student account has sample conversation
- Demonstrates AI asset recommendations
- Shows typing animation and suggestions

### Assets
- Mock assets from AssetsMarketplace.tsx
- Various categories (2D, 3D, Audio, etc.)
- Free and paid options
- Realistic pricing in VND

---

## 🔧 Reset Demo Data

Nếu cần reset toàn bộ data về trạng thái ban đầu:

```javascript
// Open browser console and run:
import { resetDemoData } from './src/data/seedData';
resetDemoData();

// Then refresh the page
location.reload();
```

Hoặc đơn giản xóa localStorage:

```javascript
localStorage.clear();
location.reload();
```

---

## 💻 Development Notes

### Auto-seeding
- Demo data được seed tự động khi app khởi động (App.tsx)
- Chỉ seed nếu localStorage trống (không overwrite)
- Console log confirmation: "✅ Demo users seeded successfully"

### Storage Keys
```javascript
users            // All user accounts
currentUser      // Currently logged in user email
cart_items       // Shopping cart
purchased_assets // User's owned assets
chat_history     // AI chat messages
admin_assets     // All assets (admin management)
admin_orders     // Order history
admin_packages   // Package sales data
```

### Quick Access Functions
```typescript
import { getDemoAccounts, seedDemoData, resetDemoData } from './src/data/seedData';

// Get demo account list
const accounts = getDemoAccounts();

// Manually seed data
seedDemoData();

// Clear all data
resetDemoData();
```

---

## 🎨 UI Features to Demo

1. **Kinetic Theme**
   - Dark navy background (#0a0e1a)
   - Cyan primary (#00d9ff) with glow effects
   - Purple secondary (#a855f7)
   - Hover animations and scale effects

2. **Typography**
   - Space Grotesk for headings
   - Inter for body text
   - JetBrains Mono for numbers/prices

3. **Components**
   - Gradient buttons with glow
   - Glass morphism cards
   - Status badges (success/warning/destructive)
   - Charts with Recharts
   - Modal dialogs

4. **Responsive Design**
   - Mobile-first approach
   - Grid layouts (2/3/4 columns)
   - Hamburger menu on mobile
   - Touch-friendly buttons

---

**Happy Testing! 🎮🚀**

**Version:** 1.0.0  
**Last Updated:** 2024-02-25
