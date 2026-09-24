import { apiClient } from './axios';
import type { User } from '../types';

export const login = async (data: any) => {
  const formData = new FormData();
  formData.append('username', data.email);
  formData.append('password', data.password);
  const response = await apiClient.post('/auth/login', formData);
  return response.data;
};

export const register = async (data: any) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const createUser = async (data: any): Promise<User> => {
  const response = await apiClient.post('/auth/admin/create-user', data);
  return response.data;
};

export const getUsers = async (role?: string): Promise<User[]> => {
  const params = role ? { role } : {};
  const response = await apiClient.get('/auth/users', { params });
  return response.data;
};
