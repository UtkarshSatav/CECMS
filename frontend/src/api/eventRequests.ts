import { apiClient } from './axios';
import type { EventRequest } from '../types';

export const getEventRequests = async (params?: {
  club_id?: number;
  status_filter?: string;
}): Promise<EventRequest[]> => {
  const response = await apiClient.get('/event-requests/', { params });
  return response.data;
};

export const getEventRequest = async (id: number): Promise<EventRequest> => {
  const response = await apiClient.get(`/event-requests/${id}`);
  return response.data;
};

export const createEventRequest = async (data: {
  club_id: number;
  title: string;
  description?: string;
  event_date: string;
  venue?: string;
  capacity: number;
  registration_deadline?: string;
  proposed_budget?: number;
  budget_breakdown?: string;
}): Promise<EventRequest> => {
  const response = await apiClient.post('/event-requests/', data);
  return response.data;
};

export const decideEventRequest = async (
  id: number,
  decision: { status: 'APPROVED' | 'REJECTED'; admin_notes?: string }
): Promise<EventRequest> => {
  const response = await apiClient.put(`/event-requests/${id}/decision`, decision);
  return response.data;
};
