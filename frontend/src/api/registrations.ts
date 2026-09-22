import { apiClient } from './axios';
import type {  Registration  } from '../types';

export const registerForEvent = async (eventId: number): Promise<Registration> => {
  const response = await apiClient.post(`/registrations/${eventId}`);
  return response.data;
};

export const cancelRegistration = async (eventId: number) => {
  const response = await apiClient.delete(`/registrations/${eventId}`);
  return response.data;
};

export const getMyRegistrations = async (): Promise<Registration[]> => {
  const response = await apiClient.get('/registrations/my');
  return response.data;
};
