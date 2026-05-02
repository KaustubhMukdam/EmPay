import apiClient from '@/api';
import type { LoginResponse, RegisterPayload, User } from '@/types/auth.types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const res = await apiClient.post<User>('/auth/register', payload);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
};
