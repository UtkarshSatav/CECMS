import { apiClient } from './axios';
import type {  DashboardStats  } from '../types';

export const getDashboard = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/reports/dashboard');
  return response.data;
};

export const getClubReports = async () => {
  const response = await apiClient.get('/reports/clubs');
  return response.data;
};

export const getEventReports = async () => {
  const response = await apiClient.get('/reports/events');
  return response.data;
};

export const getFacultyOverview = async () => {
  const response = await apiClient.get('/reports/faculty/overview');
  return response.data;
};
