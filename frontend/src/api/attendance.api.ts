import apiClient from '@/api';
import type { AttendanceRecord, AttendanceSummary } from '@/types/attendance.types';

const buildMonthParams = (month?: number, year?: number) => {
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const attendanceApi = {
  checkIn: async (): Promise<AttendanceRecord> => {
    const res = await apiClient.post<AttendanceRecord>('/attendance/checkin');
    return res.data;
  },

  checkOut: async (): Promise<AttendanceRecord> => {
    const res = await apiClient.post<AttendanceRecord>('/attendance/checkout');
    return res.data;
  },

  getMyAttendance: async (month?: number, year?: number): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<AttendanceRecord[]>(`/attendance/my${buildMonthParams(month, year)}`);
    return res.data;
  },

  getAllAttendance: async (month?: number, year?: number): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<AttendanceRecord[]>(`/attendance/all${buildMonthParams(month, year)}`);
    return res.data;
  },

  getSummary: async (employeeId: string, month: number, year: number): Promise<AttendanceSummary> => {
    const res = await apiClient.get<AttendanceSummary>(`/attendance/summary/${employeeId}`, {
      params: { month, year },
    });
    return res.data;
  },
};