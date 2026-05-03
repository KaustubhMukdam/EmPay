export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveType {
  id: string;
  name: string;
  is_paid: boolean;
  max_days: number;
}

export interface LeaveAllocation {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface LeaveRequestCreate {
  leave_type_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
}

export interface LeaveTypeCreate {
  name: string;
  is_paid: boolean;
  max_days: number;
}

export interface LeaveAllocationCreate {
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const LEAVE_STATUS_CLASSES: Record<LeaveStatus, string> = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};
