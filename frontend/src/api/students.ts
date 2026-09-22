import { apiClient } from './axios';
import type {  User, Participation  } from '../types';

export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get('/students/me');
  return response.data;
};

export const updateProfile = async (data: any): Promise<User> => {
  const response = await apiClient.put('/students/me', data);
  return response.data;
};

export const getParticipation = async (): Promise<Participation> => {
  const response = await apiClient.get('/students/me/participation');
  return response.data;
};
