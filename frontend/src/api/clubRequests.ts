import { apiClient } from './axios';
import type { ClubRequest } from '../types';

export const getClubRequests = async (statusFilter?: string): Promise<ClubRequest[]> => {
  const params = statusFilter ? { status_filter: statusFilter } : {};
  const response = await apiClient.get('/club-requests/', { params });
  return response.data;
};

export const createClubRequest = async (data: {
  name: string;
  description?: string;
  category?: string;
  initial_leader_id?: number;
}): Promise<ClubRequest> => {
  const response = await apiClient.post('/club-requests/', data);
  return response.data;
};

export const decideClubRequest = async (
  id: number,
  decision: { status: 'APPROVED' | 'REJECTED'; rejection_reason?: string }
): Promise<ClubRequest> => {
  const response = await apiClient.put(`/club-requests/${id}/decision`, decision);
  return response.data;
};
