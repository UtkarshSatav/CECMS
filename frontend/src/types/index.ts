export type Role = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'STUDENT' 
  | 'ADMINISTRATOR' 
  | 'CLUB_COORDINATOR' 
  | 'FACULTY_COORDINATOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active?: boolean;
  is_club_leader?: boolean;
  led_club_ids?: number[];
  created_at?: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  status?: string;
  member_count?: number;
  leader_id?: number;
  leader?: User;
  club_coordinator_id?: number;
  faculty_coordinator_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Membership {
  id: number;
  student_id: number;
  club_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_leader?: boolean;
  requested_at?: string;
  decided_at?: string;
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
  registration_deadline?: string;
  club_id: number;
  status?: string;
  registration_count?: number;
  club?: Club;
  created_by?: number;
  event_request_id?: number;
}

export interface ClubRequest {
  id: number;
  name: string;
  description?: string;
  category?: string;
  initial_leader_id?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  decided_by?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  requester?: User;
  initial_leader?: User;
}

export interface EventRequest {
  id: number;
  club_id: number;
  created_by: number;
  title: string;
  description?: string;
  event_date: string;
  venue?: string;
  capacity: number;
  registration_deadline?: string;
  proposed_budget: number;
  budget_breakdown?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decided_by?: number;
  admin_notes?: string;
  event_id?: number;
  created_at: string;
  updated_at?: string;
  creator?: User;
  club_name?: string;
}

export interface BudgetRequest {
  id: number;
  club_id: number;
  event_request_id?: number;
  created_by: number;
  title: string;
  amount: number;
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decided_by?: number;
  remarks?: string;
  created_at: string;
  updated_at?: string;
  creator?: User;
  club_name?: string;
  event_title?: string;
}

export interface Registration {
  id: number;
  student_id: number;
  event_id: number;
  registered_at?: string;
  registration_date?: string;
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
  users?: number;
  admins?: number;
  students?: number;
  total_clubs: number;
  total_events: number;
  total_students?: number;
  total_registrations: number;
  pending_club_requests?: number;
  pending_event_requests?: number;
  pending_budget_requests?: number;
  approved_budget_total?: number;
}

export interface Participation {
  memberships: Membership[];
  registrations: Registration[];
  attendance: any[];
}
