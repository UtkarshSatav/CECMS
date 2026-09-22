import { apiClient } from './axios';
import type {  Event  } from '../types';

export const getEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get('/events/');
  return response.data;
};

export const getEvent = async (id: number): Promise<Event> => {
  const response = await apiClient.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data: any): Promise<Event> => {
  const response = await apiClient.post('/events/', data);
  return response.data;
};

export const updateEvent = async (id: number, data: any): Promise<Event> => {
  const response = await apiClient.put(`/events/${id}`, data);
  return response.data;
};

export const cancelEvent = async (id: number) => {
  const response = await apiClient.delete(`/events/${id}`);
  return response.data;
};
