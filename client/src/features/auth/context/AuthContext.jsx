import { createContext, useContext, useEffect, useState } from 'react';
import { request } from '../../../shared/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('blog_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

      request('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('blog_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('blog_admin_token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('blog_admin_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
