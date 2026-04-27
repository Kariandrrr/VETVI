import React, { createContext, useState, useCallback, useEffect } from 'react';
import type {UserRead, UserCreate} from '@/types/auth';
import { authAPI } from '@/api/auth';

interface AuthContextType {
  user: UserRead | null;
  loading: boolean;
  error: string | null;
  register: (data: UserCreate) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
        } catch (err) {
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = useCallback(async (data: UserCreate) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authAPI.register(data);
      setUser(newUser);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || 'Ошибка регистрации';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.login(username, password);
      const userData = await authAPI.me();
      setUser(userData);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || 'Ошибка входа';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};