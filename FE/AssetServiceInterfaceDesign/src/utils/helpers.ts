/**
 * Utility Helper Functions
 * Common helpers used across the Game Assets AI Platform
 */

import { credits as creditsConfig } from '../constants/theme';

/**
 * Format price in Vietnamese Dong
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return `${price.toLocaleString('vi-VN')}đ`;
}

/**
 * Format credits display with "xu" terminology
 */
export function formatCredits(credits: number): string {
  if (credits === -1) return '∞ Unlimited';
  return `${credits} ${creditsConfig.displayName}`;
}

/**
 * Check if user has low credits (warning threshold)
 */
export function isLowCredits(credits: number): boolean {
  if (credits === -1) return false; // unlimited
  return credits < creditsConfig.warningThreshold;
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Combine CSS class names (simple version)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get storage item with type safety
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set storage item with type safety
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

/**
 * Remove storage item
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Get package display name in Vietnamese
 */
export function getPackageDisplayName(packageType: string): string {
  const names: Record<string, string> = {
    free: 'Miễn Phí',
    student: 'Gói Student',
    indie: 'Gói Indie',
    pro: 'Gói Pro',
  };
  return names[packageType.toLowerCase()] || packageType;
}

/**
 * Get order status display text
 */
export function getOrderStatusText(status: 'completed' | 'pending' | 'cancelled'): string {
  const statusText: Record<string, string> = {
    completed: 'Hoàn thành',
    pending: 'Đang xử lý',
    cancelled: 'Đã hủy',
  };
  return statusText[status] || status;
}

/**
 * Get user role display text
 */
export function getRoleDisplayText(role: string): string {
  const roleText: Record<string, string> = {
    admin: 'Quản trị viên',
    customer: 'Khách hàng',
  };
  return roleText[role.toLowerCase()] || role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === 'admin';
}

/**
 * Get asset category icon/emoji
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    '2D Characters': '👥',
    '2D Environments': '🏞️',
    'UI/UX': '🎨',
    'Sound Effects': '🔊',
    Music: '🎵',
    '3D Models': '🎲',
    Animations: '🎬',
    Particles: '✨',
  };
  return icons[category] || '📦';
}

/**
 * Format large numbers (e.g., 1234 -> 1.2k)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Sort array by field
 */
export function sortBy<T>(array: T[], field: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Group array by field
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Generate mock typing delay for AI chat
 */
export function getTypingDelay(text: string): number {
  // 50ms per character for realistic typing effect
  return text.length * 50;
}

/**
 * Validate password strength (minimum 6 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}
