/**
 * Design System Theme Constants
 *
 * Centralized theme values for the Game Assets AI Platform.
 * These match the CSS custom properties in src/styles/theme.css
 */

export const colors = {
  // Base
  background: '#0a0e1a',
  foreground: '#f8f9fa',
  card: '#0f172a',
  border: '#1e293b',

  // Brand
  primary: '#00d9ff',
  primaryForeground: '#0a0e1a',
  secondary: '#a855f7',
  secondaryForeground: '#f8f9fa',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ec4899',
  muted: '#64748b',
  mutedForeground: '#94a3b8',
} as const;

export const fonts = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const spacing = {
  containerMaxWidth: '80rem', // max-w-7xl
  containerPadding: {
    mobile: '1rem',    // px-4
    tablet: '1.5rem',  // sm:px-6
    desktop: '2rem',   // lg:px-8
  },
  cardPadding: {
    mobile: '1.5rem',  // p-6
    desktop: '2rem',   // p-8
  },
  gap: {
    cards: '1.5rem',   // gap-6
    forms: '1rem',     // gap-4
    buttons: '0.5rem', // gap-2
  },
} as const;

export const borderRadius = {
  sm: '0.5rem',   // rounded-lg (8px)
  md: '0.75rem',  // rounded-xl (12px)
  lg: '1rem',     // rounded-2xl (16px)
  full: '9999px', // rounded-full
} as const;

export const shadows = {
  // Glow effects
  primaryGlowLight: '0 0 20px rgba(0, 217, 255, 0.1)',
  primaryGlow: '0 0 30px rgba(0, 217, 255, 0.3)',
  primaryGlowStrong: '0 0 30px rgba(0, 217, 255, 0.5)',
  modalGlow: '0 0 50px rgba(0, 217, 255, 0.2)',

  // Semantic glows
  successGlow: '0 0 20px rgba(16, 185, 129, 0.3)',
  warningGlow: '0 0 20px rgba(245, 158, 11, 0.3)',
  destructiveGlow: '0 0 20px rgba(236, 72, 153, 0.3)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Common CSS class combinations for reuse
 */
export const componentClasses = {
  // Buttons
  buttonPrimary:
    'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:opacity-50 disabled:hover:scale-100',

  buttonSecondary:
    'bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-6 py-3 rounded-lg font-semibold transition-all',

  buttonSuccess:
    'bg-success text-success-foreground hover:bg-success/90 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50',

  buttonDestructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50',

  buttonGhost:
    'bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-4 py-2 rounded-lg font-medium transition-all',

  // Cards
  card: 'bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all',

  cardSimple: 'bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all',

  // Badges
  badgeSuccess: 'px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success',
  badgeWarning: 'px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning',
  badgeDestructive: 'px-3 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive',
  badgePrimary: 'px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary',

  // Inputs
  input: 'w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',

  // Container
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  // Page
  page: 'min-h-[calc(100vh-200px)] py-12',
} as const;

/**
 * Animation durations (in ms)
 */
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Z-index layers
 */
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Package pricing (in VND)
 */
export const packages = {
  free: {
    name: 'FREE',
    price: 0,
    credits: 100,
  },
  student: {
    name: 'STUDENT',
    price: 29000,
    credits: 1000,
  },
  pro: {
    name: 'PRO',
    price: 99000,
    credits: -1,
  },
} as const;

/**
 * Credits terminology
 */
export const credits = {
  displayName: 'xu',
  warningThreshold: 5,
  freeInitialAmount: 100,
} as const;
