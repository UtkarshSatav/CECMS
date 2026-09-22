export type Role = 'STUDENT' | 'CLUB_COORDINATOR' | 'FACULTY_COORDINATOR' | 'ADMINISTRATOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  status?: string;
  member_count?: number;
  club_coordinator_id?: number;
  faculty_coordinator_id?: number;
}

export interface Membership {
  id: number;
  student_id: number;
  club_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  joined_at?: string;
  student?: User;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  capacity: number;
  registration_deadline: string;
  club_id: number;
  status?: string;
  registration_count?: number;
  club?: Club;
}

export interface Registration {
  id: number;
  student_id: number;
  event_id: number;
  registration_date: string;
  status: string;
  event?: Event;
  student?: User;
}

export interface AttendanceRecord {
  registration_id: number;
  status: 'PRESENT' | 'ABSENT';
}

export interface AttendanceDisplay {
  registration_id: number;
  student_name: string;
  student_email: string;
  status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED';
}

export interface DashboardStats {
  total_clubs: number;
  total_events: number;
  total_students: number;
  total_registrations: number;
}

export interface Participation {
  memberships: Membership[];
  registrations: Registration[];
  attendance: any[];
}
