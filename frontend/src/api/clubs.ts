import { apiClient } from './axios';
import type { Club, Membership, User } from '../types';

export const getClubs = async (): Promise<Club[]> => {
  const response = await apiClient.get('/clubs/');
  return response.data;
};

export const getAllClubs = async (): Promise<Club[]> => {
  const response = await apiClient.get('/clubs/all');
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

export const allotStudent = async (clubId: number, data: { student_id: number; is_leader?: boolean }): Promise<Membership> => {
  const response = await apiClient.post(`/clubs/${clubId}/allot-student`, data);
  return response.data;
};

export const setClubLeader = async (clubId: number, studentId: number): Promise<Club> => {
  const response = await apiClient.put(`/clubs/${clubId}/leader`, { student_id: studentId });
  return response.data;
};

export const removeClubMember = async (clubId: number, studentId: number) => {
  const response = await apiClient.delete(`/clubs/${clubId}/members/${studentId}`);
  return response.data;
};

export const getAvailableStudents = async (): Promise<User[]> => {
  const response = await apiClient.get('/clubs/students/available');
  return response.data;
};
