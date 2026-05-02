export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  employee_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_on_leave: number;
  days_half_day: number;
  total_working_hours: number;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  on_leave: 'On Leave',
};

export const ATTENDANCE_STATUS_CLASSES: Record<AttendanceStatus, string> = {
  present: 'badge-success',
  absent: 'badge-danger',
  half_day: 'badge-info',
  on_leave: 'badge-warning',
};
