# Component Quick Reference

Tài liệu tham khảo nhanh các component patterns thông dụng trong dự án.

---

## 🎨 Buttons

### Primary CTA Button
```tsx
<button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]">
  Đăng ký ngay
</button>
```

### Secondary Button
```tsx
<button className="bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-6 py-3 rounded-lg transition-all">
  Tìm hiểu thêm
</button>
```

### Destructive Button
```tsx
<button className="bg-destructive hover:bg-destructive/90 text-primary-foreground px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]">
  Xóa
</button>
```

### Icon Button
```tsx
<button className="text-primary hover:text-primary/80 transition-colors">
  <Edit className="w-5 h-5" />
</button>
```

---

## 📦 Cards

### Standard Card với Hover
```tsx
<div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all">
  <h3 className="text-xl font-bold text-foreground mb-4">Card Title</h3>
  <p className="text-muted-foreground">Card content...</p>
</div>
```

### Simple Card
```tsx
<div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all">
  Content
</div>
```

### Stat Card với Icon
```tsx
<div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="bg-gradient-to-r from-primary to-primary/80 p-3 rounded-xl text-primary-foreground shadow-lg">
      <Users className="w-6 h-6" />
    </div>
    <span className="text-success text-sm font-bold">+12%</span>
  </div>
  <p className="text-muted-foreground text-sm mb-1">Tổng người dùng</p>
  <p className="text-3xl font-bold text-foreground font-mono">285</p>
</div>
```

---

## 🏷️ Badges

### Success Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success">
  Hoàn thành
</span>
```

### Warning Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning">
  Đang xử lý
</span>
```

### Destructive Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive">
  Đã hủy
</span>
```

### Primary Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
  STUDENT
</span>
```

---

## 📝 Form Inputs

### Text Input
```tsx
<input
  type="text"
  placeholder="Nhập email..."
  className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
/>
```

### Search Input với Icon
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
  <input
    type="text"
    placeholder="Tìm kiếm..."
    className="bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
  />
</div>
```

### Select Dropdown
```tsx
<select className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
  <option value="all">Tất cả</option>
  <option value="characters">2D Characters</option>
  <option value="ui">UI/UX</option>
</select>
```

### Textarea
```tsx
<textarea
  placeholder="Nhập mô tả..."
  rows={4}
  className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
/>
```

---

## 🎯 Navigation

### Nav Link Active
```tsx
<Link
  to="/dashboard"
  className="text-primary font-medium hover:text-primary/80 transition-colors"
>
  Dashboard
</Link>
```

### Nav Link Inactive
```tsx
<Link
  to="/pricing"
  className="text-muted-foreground hover:text-foreground transition-colors"
>
  Pricing
</Link>
```

### Tab Active
```tsx
<button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_30px_rgba(0,217,255,0.3)] flex items-center gap-2">
  <BarChart3 className="w-4 h-4" />
  Tổng quan
</button>
```

### Tab Inactive
```tsx
<button className="px-6 py-3 rounded-xl bg-card/50 text-muted-foreground hover:bg-card border border-border hover:border-primary/50 flex items-center gap-2 transition-all">
  <Users className="w-4 h-4" />
  Người dùng
</button>
```

---

## 📋 Tables

### Table Container
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border">
        <th className="text-left text-muted-foreground font-medium py-3 px-4">
          Tên
        </th>
        <th className="text-left text-muted-foreground font-medium py-3 px-4">
          Email
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border/50 hover:bg-card/50">
        <td className="py-4 px-4 text-foreground font-medium">Nguyễn Văn A</td>
        <td className="py-4 px-4 text-muted-foreground">user@example.com</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🪟 Modals

### Modal Backdrop + Container
```tsx
<>
  {/* Backdrop */}
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
    onClick={onClose}
  />
  
  {/* Modal */}
  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,217,255,0.2)]">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-foreground">Modal Title</h3>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
    {/* Modal content */}
  </div>
</>
```

---

## 💬 Chat Messages

### User Message
```tsx
<div className="flex justify-end">
  <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] shadow-lg">
    <p>Tôi muốn làm game platformer 2D...</p>
  </div>
</div>
```

### AI Message
```tsx
<div className="flex justify-start">
  <div className="bg-card border border-border text-foreground rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
    <p>Đây là gợi ý từ AI...</p>
  </div>
</div>
```

---

## 📊 Stats & Metrics

### Stat Display
```tsx
<div className="flex items-center gap-2">
  <Coins className="w-4 h-4 text-warning" />
  <span className="font-bold font-mono text-foreground">125 xu</span>
</div>
```

### Price Display
```tsx
<p className="text-2xl font-bold text-primary font-mono">
  {price.toLocaleString('vi-VN')}đ
</p>
```

### Progress Bar
```tsx
<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(0,217,255,0.5)] transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 📐 Layouts

### Page Container
```tsx
<div className="min-h-[calc(100vh-200px)] py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Page content */}
  </div>
</div>
```

### Grid Layout
```tsx
{/* 2 columns on tablet, 3 on desktop */}
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

{/* 4 columns responsive */}
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Grid items */}
</div>
```

### Flex Layout
```tsx
{/* Space between */}
<div className="flex items-center justify-between mb-6">
  <h2 className="text-2xl font-bold text-foreground">Title</h2>
  <button>Action</button>
</div>

{/* Center */}
<div className="flex items-center justify-center gap-4">
  <Icon />
  <span>Text</span>
</div>
```

---

## 🎨 Gradients

### Text Gradient
```tsx
<h1 className="text-5xl font-bold">
  Tìm Assets{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
    Dễ Dàng Hơn
  </span>
</h1>
```

### Background Gradient
```tsx
<div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-xl text-primary-foreground">
  Content
</div>
```

### Border Gradient (with shadow)
```tsx
<div className="border border-primary/30 bg-primary/10 rounded-xl p-4 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
  Content
</div>
```

---

## 🔔 Notifications / Alerts

### Info Alert
```tsx
<div className="bg-primary/10 border border-primary/30 text-primary rounded-lg p-4 flex items-start gap-3">
  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-bold mb-1">Thông báo</p>
    <p className="text-sm">Thông tin quan trọng...</p>
  </div>
</div>
```

### Success Alert
```tsx
<div className="bg-success/10 border border-success/30 text-success rounded-lg p-4 flex items-start gap-3">
  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-bold mb-1">Thành công</p>
    <p className="text-sm">Đã hoàn thành!</p>
  </div>
</div>
```

### Warning Alert
```tsx
<div className="bg-warning/10 border border-warning/30 text-warning rounded-lg p-4 flex items-start gap-3">
  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-bold mb-1">Cảnh báo</p>
    <p className="text-sm">Bạn sắp hết xu!</p>
  </div>
</div>
```

---

## 💡 Tips

### Import Icons
```tsx
import { Icon1, Icon2 } from "lucide-react";
```

### Common Icon Sizes
- `w-4 h-4` - Small (16px)
- `w-5 h-5` - Default (20px)
- `w-6 h-6` - Large (24px)

### Font Classes
- Display/Headings: Default (Space Grotesk)
- Numbers/Prices: `font-mono` (JetBrains Mono)
- Body text: Default (Inter)

### Responsive Breakpoints
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

---

**Xem thêm:**
- [CLAUDE.md](./CLAUDE.md) - Full design system
- [README.md](./README.md) - Project overview
- [src/constants/theme.ts](./src/constants/theme.ts) - Design tokens
