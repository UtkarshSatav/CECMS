import { apiClient } from './axios';
import type {  Club, Membership  } from '../types';

export const getClubs = async (): Promise<Club[]> => {
  const response = await apiClient.get('/clubs/');
  return response.data;
};

export const getClub = async (id: number): Promise<Club> => {
  const response = await apiClient.get(`/clubs/${id}`);
  return response.data;
};

export const createClub = async (data: any): Promise<Club> => {
  const response = await apiClient.post('/clubs/', data);
  return response.data;
};

export const updateClub = async (id: number, data: any): Promise<Club> => {
  const response = await apiClient.put(`/clubs/${id}`, data);
  return response.data;
};

export const joinClub = async (id: number): Promise<Membership> => {
  const response = await apiClient.post(`/clubs/${id}/join`);
  return response.data;
};

export const getClubMembers = async (id: number): Promise<Membership[]> => {
  const response = await apiClient.get(`/clubs/${id}/members`);
  return response.data;
};

export const getClubRequests = async (id: number): Promise<Membership[]> => {
  const response = await apiClient.get(`/clubs/${id}/requests`);
  return response.data;
};

export const decideMembership = async (clubId: number, membershipId: number, status: string): Promise<Membership> => {
  const response = await apiClient.put(`/clubs/${clubId}/requests/${membershipId}`, { status });
  return response.data;
};
