import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_BASE_URL } from '../config/api';

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  isOverdue: boolean;
  repaidAt: string | null;
  hasReceipt: boolean;
  receiptPath: string | null;
  receiptOriginalName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanPayload {
  friendName: string;
  amount: number;
  dueDate: string;
}

export const loansService = {
  async getLoans(): Promise<Loan[]> {
    const response = await apiClient.get<{ success: boolean; data: Loan[] }>('/loans');
    return response.data.data;
  },

  async createLoan(payload: CreateLoanPayload): Promise<Loan> {
    const response = await apiClient.post<{ success: boolean; data: Loan }>('/loans', payload);
    return response.data.data;
  },

  async markAsRepaid(loanId: string): Promise<Loan> {
    const response = await apiClient.patch<{ success: boolean; data: Loan }>(`/loans/${loanId}/repay`);
    return response.data.data;
  },

  async uploadReceipt(loanId: string, uri: string, mimeType?: string, fileName?: string): Promise<void> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('receipt', blob, fileName || 'receipt.jpg');
    } else {
      // React Native file upload format
      formData.append('receipt', {
        uri,
        name: fileName || 'receipt.jpg',
        type: mimeType || 'image/jpeg',
      } as unknown as Blob);
    }

    await apiClient.post(`/loans/${loanId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getReceiptDownloadUrl(loanId: string): string {
    return `${API_BASE_URL}/loans/${loanId}/receipt`;
  },
};
