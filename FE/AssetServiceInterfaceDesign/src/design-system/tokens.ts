/**
 * Platform-agnostic design tokens for AssetBox.
 * Safe to import from React Native / Expo — no Tailwind or DOM dependencies.
 *
 * Web: also mirrored in src/styles/theme.css as CSS variables.
 */

export const colors = {
  background: '#0a0e1a',
  foreground: '#f8f9fa',
  card: '#0f172a',
  border: '#1e293b',
  primary: '#00d9ff',
  primaryForeground: '#0a0e1a',
  secondary: '#a855f7',
  secondaryForeground: '#f8f9fa',
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ec4899',
  muted: '#64748b',
  mutedForeground: '#94a3b8',
} as const;

export const fonts = {
  display: 'Space Grotesk',
  body: 'Inter',
  mono: 'JetBrains Mono',
} as const;

export const spacing = {
  containerMaxWidth: 1280,
  containerPadding: { mobile: 16, tablet: 24, desktop: 32 },
  cardPadding: { mobile: 24, desktop: 32 },
  gap: { cards: 24, forms: 16, buttons: 8 },
  touchMin: 44,
  bottomNavHeight: 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const MOBILE_MAX_WIDTH_PX = breakpoints.md - 1;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const packages = {
  free: { name: 'FREE', price: 0, credits: 100 },
  student: { name: 'STUDENT', price: 29000, credits: 1000 },
  pro: { name: 'PRO', price: 99000, credits: -1 },
} as const;

export const credits = {
  displayName: 'xu',
  warningThreshold: 5,
  freeInitialAmount: 100,
} as const;

/** Bottom tab config — reuse labels/routes in React Navigation */
export const mobileNav = {
  authenticated: [
    { route: '/', label: 'Trang chủ', key: 'home' },
    { route: '/dashboard', label: 'AI', key: 'ai' },
    { route: '/marketplace', label: 'Chợ', key: 'marketplace' },
    { route: '/my-assets', label: 'Thư viện', key: 'library' },
    { route: '/profile', label: 'Tôi', key: 'profile' },
  ],
  guest: [
    { route: '/', label: 'Trang chủ', key: 'home' },
    { route: '/marketplace', label: 'Chợ', key: 'marketplace' },
    { route: '/pricing', label: 'Gói', key: 'pricing' },
    { route: '/dashboard', label: 'AI', key: 'ai' },
    { route: '/auth', label: 'Đăng nhập', key: 'auth' },
  ],
  hiddenRoutePrefixes: [
    '/auth',
    '/admin',
    '/checkout',
    '/checkout-credits',
    '/checkout-assets',
    '/add-asset',
  ],
} as const;
