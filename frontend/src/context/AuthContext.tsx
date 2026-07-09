'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  coins: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): { is_staff?: boolean } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('nmo_token');
    const payload = token ? decodeToken(token) : null;

    if (payload?.is_staff) {
      try {
        const { data } = await api.get('/admin/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
      }
    } else {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        try {
          const { data } = await api.get('/admin/auth/me');
          setUser(data.user);
        } catch {
          setUser(null);
        }
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('nmo_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    if (role === 'broker') {
      const { data } = await api.post('/auth/broker/login', { email, password });
      localStorage.setItem('nmo_token', data.token);
      setUser(data.user);
      return;
    }
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('nmo_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('nmo_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
