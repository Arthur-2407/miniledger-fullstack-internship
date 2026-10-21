import { apiClient } from './apiClient';
import { storage } from '../utils/storage';

export interface AuthUser {
  id: string;
  phone: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async requestOtp(phone: string): Promise<{ success: boolean; message: string; phone: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { phone: string };
    }>('/auth/request-otp', { phone });

    return {
      success: response.data.success,
      message: response.data.message,
      phone: response.data.data.phone,
    };
  },

  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthResponse;
    }>('/auth/verify-otp', { phone, otp });

    const authData = response.data.data;
    await storage.setItem('miniledger_token', authData.token);
    await storage.setItem('miniledger_user', JSON.stringify(authData.user));

    return authData;
  },

  async getSavedSession(): Promise<{ token: string; user: AuthUser } | null> {
    const token = await storage.getItem('miniledger_token');
    const userJson = await storage.getItem('miniledger_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        return { token, user };
      } catch {
        return null;
      }
    }
    return null;
  },

  async logout(): Promise<void> {
    await storage.removeItem('miniledger_token');
    await storage.removeItem('miniledger_user');
  },
};
