/**
 * Debug utilities for localStorage
 * Use in browser console for troubleshooting
 */

/**
 * Show all users in localStorage
 */
export function showUsers() {
  const usersData = localStorage.getItem('users');
  if (!usersData) {
    console.log('❌ No users found in localStorage');
    return;
  }

  const users = JSON.parse(usersData);
  console.log('👥 Users in localStorage:');
  console.table(
    Object.keys(users).map(email => ({
      email,
      name: users[email].name,
      role: users[email].role,
      credits: users[email].credits,
      subscription: users[email].subscription,
    }))
  );
  return users;
}

/**
 * Force re-seed demo data
 */
export function forceSeedDemoData() {
  const { demoUsers } = require('../data/seedData');
  const existingUsers = localStorage.getItem('users');
  const users = existingUsers ? JSON.parse(existingUsers) : {};

  // Merge demo users
  const mergedUsers = { ...users, ...demoUsers };
  localStorage.setItem('users', JSON.stringify(mergedUsers));

  console.log('✅ Demo data force-seeded!');
  console.log('📋 Available accounts:');
  showUsers();
}

/**
 * Clear all data and re-seed
 */
export function resetAndSeed() {
  localStorage.clear();
  console.log('🗑️ localStorage cleared');

  const { seedDemoData } = require('../data/seedData');
  seedDemoData();

  console.log('✅ Fresh demo data seeded!');
  showUsers();
}

/**
 * Test login with credentials
 */
export function testLogin(email: string, password: string) {
  const usersData = localStorage.getItem('users');
  if (!usersData) {
    console.log('❌ No users in localStorage');
    return false;
  }

  const users = JSON.parse(usersData);
  const user = users[email];

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    console.log('Available emails:', Object.keys(users));
    return false;
  }

  if (user.password !== password) {
    console.log(`❌ Wrong password for ${email}`);
    console.log(`Expected: ${user.password}`);
    console.log(`Got: ${password}`);
    return false;
  }

  console.log(`✅ Login successful for ${email}`);
  console.log('User data:', user);
  return true;
}

/**
 * Show current logged in user
 */
export function showCurrentUser() {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.log('❌ No user currently logged in');
    return null;
  }

  const user = JSON.parse(currentUser);
  console.log('👤 Current user:');
  console.table(user);
  return user;
}

// Make functions available globally in dev mode
if (typeof window !== 'undefined') {
  (window as any).debugStorage = {
    showUsers,
    forceSeedDemoData,
    resetAndSeed,
    testLogin,
    showCurrentUser,
  };
}

export default {
  showUsers,
  forceSeedDemoData,
  resetAndSeed,
  testLogin,
  showCurrentUser,
};
