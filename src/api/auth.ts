import axios, { AxiosError } from 'axios';
import type {UserCreate, UserRead, Token} from '@/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Добавляем access token в headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        localStorage.setItem('access_token', response.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: UserCreate): Promise<UserRead> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  login: async (username: string, password: string): Promise<Token> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axiosInstance.post('/auth/login', formData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
    localStorage.removeItem('access_token');
  },

  me: async (): Promise<UserRead> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};

export type { AxiosError };