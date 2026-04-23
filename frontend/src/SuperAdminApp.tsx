import { useState } from 'react';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const STORAGE_KEY = 'superadmin_token';

export default function SuperAdminApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const handleLogin = (newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  if (!token) {
    return <SuperAdminLoginPage onLogin={handleLogin} />;
  }

  return <SuperAdminDashboard token={token} onLogout={handleLogout} />;
}
