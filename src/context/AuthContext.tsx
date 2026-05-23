/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { UserRead, UserCreate } from '@/types/auth';
import { authAPI } from '@/api/auth';

export interface AuthContextType {
  user: UserRead | null;
  loading: boolean;
  error: string | null;
  register: (data: UserCreate) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { display_name?: string; avatar_url?: string | null }) => Promise<UserRead>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async (): Promise<void> => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authAPI.me();
          if (isMounted) {
            setUser(userData);
          }
        } catch {
          localStorage.removeItem('access_token');
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    void checkAuth(); // ← используем void для игнорирования Promise

    return () => {
      isMounted = false;
    };
  }, []);

  const register = useCallback(async (data: UserCreate) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authAPI.register(data);
      setUser(newUser);
    } catch (err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || 'Ошибка регистрации';
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
    } catch (err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || 'Ошибка входа';
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
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (data: { display_name?: string; avatar_url?: string | null }) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || 'Ошибка обновления профиля';
      setError(message);
      throw err;
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
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};