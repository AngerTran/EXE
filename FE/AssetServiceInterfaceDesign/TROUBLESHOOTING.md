# 🔧 Troubleshooting Guide

Hướng dẫn xử lý các vấn đề thường gặp khi sử dụng Game Assets AI Platform.

---

## ❌ Problem: Cannot Login with Demo Accounts

### Symptoms:
- Click login với demo account credentials
- Nhận thông báo "Email hoặc mật khẩu không đúng"
- Không thể đăng nhập vào bất kỳ account nào

### Root Cause:
localStorage có thể chứa data cũ hoặc conflicting data từ version trước.

### Solution 1: Force Reset Data (Recommended)

**Option A: Via Browser Console**

1. Mở trang web
2. Press `F12` hoặc `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Vào tab **Console**
4. Run command:

```javascript
window.debugStorage.resetAndSeed()
```

5. Refresh page: `F5` hoặc `Ctrl+R`
6. Try login again

**Option B: Manual Clear**

1. Open browser console (`F12`)
2. Run:

```javascript
localStorage.clear();
location.reload();
```

3. Demo accounts sẽ tự động được seed lại

### Solution 2: Check Available Users

Kiểm tra xem demo accounts có trong localStorage không:

```javascript
window.debugStorage.showUsers()
```

Sẽ hiển thị table với tất cả users. Nếu không có demo accounts, run:

```javascript
window.debugStorage.forceSeedDemoData()
```

### Solution 3: Test Login

Test một account cụ thể:

```javascript
window.debugStorage.testLogin('student@demo.vn', 'demo123')
```

Sẽ cho biết chính xác lỗi là gì.

---

## 🔑 Demo Accounts Not Appearing on Auth Page

### Symptoms:
- Auth page không hiển thị demo accounts panel
- Hoặc panel trống

### Solution:

1. Refresh page (`F5`)
2. Check console for errors
3. If still not showing, run:

```javascript
import { getDemoAccounts } from './src/data/seedData';
console.log(getDemoAccounts());
```

---

## 💾 Data Persistence Issues

### Problem: Data mất sau khi refresh

### Check:
1. Browser có block localStorage không?
2. Incognito/Private mode có thể không save data
3. Check browser settings

### Solution:
Use normal browser window (not incognito)

---

## 🎯 Admin Dashboard Warnings

### Problem: React key warnings trong charts

### Status: ✅ FIXED
- PieChart duplicate keys → Fixed với unique IDs
- Stats grid keys → Fixed với unique labels
- Order items keys → Fixed với compound keys

### If still seeing warnings:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+F5`
3. Check console for specific component

---

## 🧪 Testing & Debugging

### Available Debug Functions

Open browser console and use:

```javascript
// Show all users in localStorage
window.debugStorage.showUsers()

// Show current logged in user
window.debugStorage.showCurrentUser()

// Test login credentials
window.debugStorage.testLogin('email', 'password')

// Force re-seed demo data (keeps existing users)
window.debugStorage.forceSeedDemoData()

// Clear everything and re-seed (fresh start)
window.debugStorage.resetAndSeed()
```

### Check localStorage Manually

```javascript
// View all users
JSON.parse(localStorage.getItem('users'))

// View current user
JSON.parse(localStorage.getItem('currentUser'))

// View cart
JSON.parse(localStorage.getItem('cart_items'))

// View chat history
JSON.parse(localStorage.getItem('chat_history'))
```

---

## 🚨 Common Errors

### Error: "Email đã được sử dụng"
**When:** Trying to register with existing email  
**Solution:** Use different email or login instead

### Error: "Email hoặc mật khẩu không đúng"
**When:** Login fails  
**Solutions:**
1. Check email spelling (case-sensitive)
2. Check password (demo123 or admin123)
3. Run `window.debugStorage.showUsers()` to see all accounts
4. Run `window.debugStorage.resetAndSeed()` to reset

### Error: "Có lỗi xảy ra, vui lòng thử lại"
**When:** Unexpected error  
**Solution:**
1. Check browser console for details
2. Clear localStorage and refresh
3. Check network tab for API errors

---

## 🔄 Reset Everything

Nếu mọi thứ bị lỗi, reset toàn bộ:

### Quick Reset:
```javascript
localStorage.clear();
location.reload();
```

### Full Reset với Demo Data:
```javascript
window.debugStorage.resetAndSeed();
```

---

## 📊 Admin Dashboard Issues

### Charts không hiển thị data

**Check:**
1. Có assets trong localStorage không?
2. Có orders trong localStorage không?
3. Run:

```javascript
JSON.parse(localStorage.getItem('admin_assets'))
JSON.parse(localStorage.getItem('admin_orders'))
JSON.parse(localStorage.getItem('admin_packages'))
```

**Solution:**
Admin data sẽ tự động được tạo khi vào admin dashboard lần đầu.

---

## 🛠️ Development Tips

### Hot Reload Issues
- Vite auto-reload sometimes misses changes
- Manual refresh: `Ctrl+F5`
- Clear Vite cache: Stop server → Delete `node_modules/.vite` → Restart

### TypeScript Errors
- Run: `pnpm build` to check for TS errors
- Check terminal output for details

### Styling Issues
- Tailwind classes not working? → Check `src/styles/index.css`
- Design tokens not applied? → Check `src/styles/theme.css`
- Run build to regenerate Tailwind CSS

---

## 📞 Still Having Issues?

1. **Check Console:** Look for error messages (F12 → Console)
2. **Check Network:** Look for failed requests (F12 → Network)
3. **Clear Everything:** `localStorage.clear() + location.reload()`
4. **Fresh Start:** 
   ```bash
   pnpm clean
   pnpm install
   pnpm dev
   ```

---

## 🎯 Quick Fixes Checklist

- [ ] Opened browser console (`F12`)
- [ ] Ran `window.debugStorage.showUsers()`
- [ ] Verified demo accounts exist
- [ ] Tried `window.debugStorage.resetAndSeed()`
- [ ] Refreshed page (`F5`)
- [ ] Cleared browser cache
- [ ] Used normal window (not incognito)
- [ ] Checked for console errors
- [ ] Restarted dev server

---

**Last Updated:** 2024-02-25  
**Version:** 1.0.0
