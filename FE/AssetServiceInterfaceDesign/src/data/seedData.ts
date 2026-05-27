/**
 * Seed Data for Demo
 * Pre-populated users, assets, and orders for quick testing
 */

export const demoUsers = {
  // Admin account
  'admin@gameai.vn': {
    id: 'admin-001',
    name: 'Admin GameAI',
    email: 'admin@gameai.vn',
    password: 'admin123',
    role: 'admin',
    credits: 999,
    registeredAt: '2024-01-01',
    totalSpent: 0,
  },

  // Customer accounts với các gói khác nhau
  'student@demo.vn': {
    id: 'user-001',
    name: 'Nguyễn Văn An',
    email: 'student@demo.vn',
    password: 'demo123',
    role: 'customer',
    credits: 85,
    subscription: 'student',
    registeredAt: '2024-02-15',
    totalSpent: 29000,
  },

  'indie@demo.vn': {
    id: 'user-002',
    name: 'Trần Thị Bình',
    email: 'indie@demo.vn',
    password: 'demo123',
    role: 'customer',
    credits: -1, // unlimited
    subscription: 'indie',
    registeredAt: '2024-01-20',
    totalSpent: 99000,
  },

  'pro@demo.vn': {
    id: 'user-003',
    name: 'Lê Minh Cường',
    email: 'pro@demo.vn',
    password: 'demo123',
    role: 'customer',
    credits: -1, // unlimited
    subscription: 'pro',
    registeredAt: '2024-01-10',
    totalSpent: 199000,
  },

  'free@demo.vn': {
    id: 'user-004',
    name: 'Phạm Thị Dung',
    email: 'free@demo.vn',
    password: 'demo123',
    role: 'customer',
    credits: 7,
    registeredAt: '2024-02-20',
    totalSpent: 0,
  },

  'user@example.com': {
    id: 'user-005',
    name: 'Hoàng Văn Em',
    email: 'user@example.com',
    password: 'user123',
    role: 'customer',
    credits: 45,
    subscription: 'student',
    registeredAt: '2024-02-01',
    totalSpent: 58000,
  },
};

/**
 * Initialize demo data in localStorage
 */
export function seedDemoData() {
  // Seed users - Always merge with existing to ensure demo accounts exist
  const existingUsers = localStorage.getItem('users');
  const users = existingUsers ? JSON.parse(existingUsers) : {};

  // Merge demo users (demo users take priority)
  const mergedUsers = { ...users, ...demoUsers };
  localStorage.setItem('users', JSON.stringify(mergedUsers));
  console.log('✅ Demo users seeded successfully');

  // Seed demo chat history for student account
  const studentChatHistory = [
    {
      role: 'user',
      content: 'Tôi muốn làm một game platformer 2D giống Celeste, cần những assets gì?',
      timestamp: new Date().toISOString(),
    },
    {
      role: 'assistant',
      content: 'Tuyệt vời! Game platformer 2D như Celeste cần các loại assets sau:\n\n**Character & Animation:**\n🎨 Pixel Hero Character Pack - 2D Characters (120,000đ)\n🎨 Platformer Animation Set - Animations (85,000đ)\n\n**Environment:**\n🏞️ Mountain Tileset Collection - 2D Environments (150,000đ)\n🏞️ Platform Elements Pack - 2D Environments (75,000đ)\n\n**Effects:**\n✨ Jump & Dash Particles - Particles (Miễn phí)\n✨ Collectible Sparkles - Particles (45,000đ)\n\n**Audio:**\n🎵 Atmospheric Background Music - Music (95,000đ)\n🔊 Jump & Landing SFX Pack - Sound Effects (Miễn phí)\n\nBạn có thể bắt đầu với các assets miễn phí trước, sau đó nâng cấp dần!',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Xem marketplace để chọn assets',
        'Tư vấn về game mechanics',
        'Gợi ý thêm về level design',
      ],
    },
  ];

  // Don't overwrite existing chat history
  if (!localStorage.getItem('chat_history')) {
    localStorage.setItem('chat_history', JSON.stringify(studentChatHistory));
    console.log('✅ Demo chat history seeded');
  }
}

/**
 * Reset all data (useful for testing)
 */
export function resetDemoData() {
  localStorage.removeItem('users');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('cart_items');
  localStorage.removeItem('purchased_assets');
  localStorage.removeItem('chat_history');
  localStorage.removeItem('admin_assets');
  localStorage.removeItem('admin_orders');
  localStorage.removeItem('admin_packages');

  console.log('🗑️ All data cleared');
}

/**
 * Get demo account credentials for display
 */
export function getDemoAccounts() {
  return [
    {
      title: '👤 Admin Account',
      email: 'admin@gameai.vn',
      password: 'admin123',
      description: 'Full admin access',
    },
    {
      title: '🎓 Student Account',
      email: 'student@demo.vn',
      password: 'demo123',
      description: 'Gói Student - 85 xu',
    },
    {
      title: '⚡ Indie Account',
      email: 'indie@demo.vn',
      password: 'demo123',
      description: 'Gói Indie - Unlimited xu',
    },
    {
      title: '👑 Pro Account',
      email: 'pro@demo.vn',
      password: 'demo123',
      description: 'Gói Pro - Unlimited xu',
    },
    {
      title: '🆓 Free Account',
      email: 'free@demo.vn',
      password: 'demo123',
      description: 'Gói Free - 7 xu',
    },
  ];
}
