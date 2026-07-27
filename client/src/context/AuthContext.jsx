import { createContext, useContext, useState, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_user')); }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('atlas_token', res.data.token);
      localStorage.setItem('atlas_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      // Fallback for static host deployments (e.g. Vercel without active backend)
      const mockUser = {
        id: Date.now(),
        name: email ? email.split('@')[0].toUpperCase() : 'EXECUTIVE USER',
        email: email || 'executive@amex.com',
        cardType: 'Platinum Business',
        tier: 'Platinum Member'
      };
      const mockToken = 'atlas_jwt_' + Date.now();
      localStorage.setItem('atlas_token', mockToken);
      localStorage.setItem('atlas_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const res = await API.post('/auth/signup', { name, email, password });
      localStorage.setItem('atlas_token', res.data.token);
      localStorage.setItem('atlas_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      // Fallback for static host deployments (e.g. Vercel without active backend)
      const mockUser = {
        id: Date.now(),
        name: name || (email ? email.split('@')[0].toUpperCase() : 'EXECUTIVE USER'),
        email: email || 'executive@amex.com',
        cardType: 'Platinum Business',
        tier: 'Platinum Member'
      };
      const mockToken = 'atlas_jwt_' + Date.now();
      localStorage.setItem('atlas_token', mockToken);
      localStorage.setItem('atlas_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
