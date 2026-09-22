import { apiClient } from './axios';
import type {  AttendanceDisplay, AttendanceRecord  } from '../types';

export const getEventAttendance = async (eventId: number): Promise<AttendanceDisplay[]> => {
  const response = await apiClient.get(`/attendance/event/${eventId}`);
  return response.data;
};

export const markAttendance = async (eventId: number, records: AttendanceRecord[]) => {
  const response = await apiClient.post(`/attendance/event/${eventId}`, { records });
  return response.data;
};
