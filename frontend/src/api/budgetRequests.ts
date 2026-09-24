import { apiClient } from './axios';
import type { BudgetRequest } from '../types';

export const getBudgetRequests = async (params?: {
  club_id?: number;
  status_filter?: string;
}): Promise<BudgetRequest[]> => {
  const response = await apiClient.get('/budget-requests/', { params });
  return response.data;
};

export const getBudgetRequest = async (id: number): Promise<BudgetRequest> => {
  const response = await apiClient.get(`/budget-requests/${id}`);
  return response.data;
};

export const createBudgetRequest = async (data: {
  club_id: number;
  event_request_id?: number;
  title: string;
  amount: number;
  justification?: string;
}): Promise<BudgetRequest> => {
  const response = await apiClient.post('/budget-requests/', data);
  return response.data;
};

export const decideBudgetRequest = async (
  id: number,
  decision: { status: 'APPROVED' | 'REJECTED'; remarks?: string }
): Promise<BudgetRequest> => {
  const response = await apiClient.put(`/budget-requests/${id}/decision`, decision);
  return response.data;
};
