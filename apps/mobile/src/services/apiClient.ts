import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('miniledger_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: catch 401 and handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success: boolean; error?: { message: string; code: string } }>) => {
    if (error.response?.status === 401) {
      await storage.removeItem('miniledger_token');
      await storage.removeItem('miniledger_user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);
