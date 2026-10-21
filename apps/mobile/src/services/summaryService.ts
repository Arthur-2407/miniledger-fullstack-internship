import { apiClient } from './apiClient';

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  currency: string;
}

export const summaryService = {
  async getSummary(): Promise<Summary> {
    const response = await apiClient.get<{ success: boolean; data: Summary }>('/summary');
    return response.data.data;
  },
};
