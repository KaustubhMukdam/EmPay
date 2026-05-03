import apiClient from '@/api';

export interface AdminAnalytics {
  total_employees: number;
  present_today: number;
  half_day_today: number;
  pending_leaves: number;
  payroll_due_month: number | null;
  payroll_due_year: number | null;
  processed_payruns: number;
  total_payslips: number;
}

export interface WeeklyAttendance {
  week_label: string;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
}

export interface AttendanceMonthlyResponse {
  weeks: WeeklyAttendance[];
}

export interface LeaveDistributionItem {
  leave_type: string;
  count: number;
}

export interface LeaveDistributionResponse {
  distribution: LeaveDistributionItem[];
}

export interface EmployeeSummary {
  total_working_days: number;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
  check_in_today: boolean;
  leave_balance: Record<string, number>;
}

export const analyticsApi = {
  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await apiClient.get<AdminAnalytics>('/analytics/admin');
    return res.data;
  },

  getMonthlyAttendance: async (month: number, year: number): Promise<AttendanceMonthlyResponse> => {
    const res = await apiClient.get<AttendanceMonthlyResponse>(`/analytics/monthly-attendance?month=${month}&year=${year}`);
    return res.data;
  },

  getLeaveDistribution: async (): Promise<LeaveDistributionResponse> => {
    const res = await apiClient.get<LeaveDistributionResponse>('/analytics/leave-distribution');
    return res.data;
  },

  getEmployeeSummary: async (): Promise<EmployeeSummary> => {
    const res = await apiClient.get<EmployeeSummary>('/analytics/employee-summary');
    return res.data;
  },
};
