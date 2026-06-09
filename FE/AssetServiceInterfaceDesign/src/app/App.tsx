import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { seedDemoData } from '../data/seedData';

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('../utils/debugStorage');
}

function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      seedDemoData();
      console.log('\n🎮 === ASSETBOX — DEMO ACCOUNTS ===');
      console.log('📧 Admin:   admin@gameai.vn   / admin123');
      console.log('🎓 Student: student@demo.vn   / demo123');
      console.log('⚡ Indie:   indie@demo.vn     / demo123');
      console.log('👑 Pro:     pro@demo.vn       / demo123');
      console.log('🆓 Free:    free@demo.vn      / demo123');
      console.log('👤 User:    user@example.com  / user123');
      console.log('\n💡 Debug: Use window.debugStorage.showUsers() to see all users');
      console.log('🔧 Reset:  Use window.debugStorage.resetAndSeed() to reset data\n');
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;