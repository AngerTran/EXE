/**
 * Web-only Tailwind class bundles (not for React Native).
 */

export const componentClasses = {
  buttonPrimary:
    'bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:opacity-50 disabled:hover:scale-100',

  buttonGradient:
    'bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground font-bold transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50',

  /** Cyan → lavender — đồng bộ tab/nút/badge xanh toàn site */
  ctaGradient:
    'bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] text-primary-foreground',

  ctaGradientInteractive:
    'bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] text-primary-foreground hover:brightness-95 transition-all',

  buttonSecondary:
    'bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-6 py-3 rounded-lg font-semibold transition-all',

  buttonSuccess:
    'bg-success text-success-foreground hover:bg-success/90 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50',

  buttonDestructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50',

  buttonGhost:
    'bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground px-4 py-2 rounded-lg font-medium transition-all',

  chromeSurface: 'bg-white/95 dark:bg-card/70 backdrop-blur-lg',

  card: 'bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 md:hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all',

  listCard:
    'bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4 active:scale-[0.99] transition-transform',

  cardSimple: 'bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all',

  badgeSuccess: 'px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success',
  badgeWarning: 'px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning',
  badgeDestructive: 'px-3 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive',
  badgePrimary: 'px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary',

  input:
    'w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',

  container: 'page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  page: 'min-h-[calc(100vh-200px)] py-8 sm:py-12',

  iconButton:
    'touch-target rounded-lg border border-border bg-white/95 dark:bg-card/70 hover:border-primary/50 transition-colors',
} as const;

export const mobile = {
  touchMinPx: 44,
  bottomNavHeight: '4rem',
  chatMinHeight: 'min(32rem, calc(100dvh - 18rem))',
} as const;

export const shadows = {
  primaryGlowLight: '0 0 20px rgba(0, 217, 255, 0.1)',
  primaryGlow: '0 0 30px rgba(0, 217, 255, 0.3)',
  primaryGlowStrong: '0 0 30px rgba(0, 217, 255, 0.5)',
  modalGlow: '0 0 50px rgba(0, 217, 255, 0.2)',
  successGlow: '0 0 20px rgba(16, 185, 129, 0.3)',
  warningGlow: '0 0 20px rgba(245, 158, 11, 0.3)',
  destructiveGlow: '0 0 20px rgba(236, 72, 153, 0.3)',
} as const;
