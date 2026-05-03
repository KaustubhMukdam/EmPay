import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { attendanceApi } from '@/api/attendance.api';
import type { AttendanceRecord, AttendanceStatus } from '@/types/attendance.types';

const statusLabel: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  on_leave: 'On Leave',
};

const statusColor: Record<AttendanceStatus, { bg: string; fg: string }> = {
  present: { bg: '#DCFCE7', fg: '#166534' },
  absent: { bg: '#FEE2E2', fg: '#991B1B' },
  half_day: { bg: '#FEF3C7', fg: '#92400E' },
  on_leave: { bg: '#E0E7FF', fg: '#3730A3' },
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const parseTimestampAsUtc = (value: string): Date | null => {
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  if (hasTimezone) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Backend may send naive timestamps (no timezone). Treat them as UTC.
  const normalized = value.replace(' ', 'T');
  const [datePart, timePart = '00:00:00'] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hourPart, minutePart, secondPart = '0'] = timePart.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const second = Number(secondPart.split('.')[0]);

  if ([year, month, day, hour, minute, second].some(Number.isNaN)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const utcDate = parseTimestampAsUtc(value);
  if (!utcDate) {
    return value;
  }

  const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const MyAttendancePage: React.FC = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const today = new Date().toLocaleDateString('en-CA');

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['attendance', 'my', user?.id, month, year],
    queryFn: () => attendanceApi.getMyAttendance(month, year),
  });

  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance', 'my', user?.id] }),
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance', 'my', user?.id] }),
  });

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [records]
  );

  const stats = useMemo(() => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthRecords = records.filter((record) => record.date.startsWith(monthPrefix));
    return {
      total: monthRecords.length,
      present: monthRecords.filter((record) => record.status === 'present').length,
      halfDay: monthRecords.filter((record) => record.status === 'half_day').length,
      onLeave: monthRecords.filter((record) => record.status === 'on_leave').length,
      hours: monthRecords.reduce((sum, record) => sum + (record.working_hours || 0), 0),
    };
  }, [records, month, year]);

  const todayRecord = records.find((record) => record.date === today);
  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = !!todayRecord?.check_in && !todayRecord?.check_out;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your check-in, check-out, and monthly attendance log in your local timezone.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => checkInMutation.mutate()}
            disabled={!canCheckIn || checkInMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LogIn size={16} />
            {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
          </button>
          <button
            className="btn"
            onClick={() => checkOutMutation.mutate()}
            disabled={!canCheckOut || checkOutMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E2E8F0', color: '#0F172A' }}
          >
            <LogOut size={16} />
            {checkOutMutation.isPending ? 'Checking out...' : 'Check Out'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Present days', value: stats.present, icon: <CheckCircle2 size={18} /> },
          { label: 'Half days', value: stats.halfDay, icon: <Clock3 size={18} /> },
          { label: 'On leave', value: stats.onLeave, icon: <CalendarDays size={18} /> },
          { label: 'Total hours', value: stats.hours.toFixed(1), icon: <Clock3 size={18} /> },
        ].map((item) => (
          <div key={item.label} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>{item.label}</span>
              {item.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label className="form-label">Month</label>
          <select className="form-input" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ minWidth: 150 }}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>{new Date(2000, value - 1, 1).toLocaleString('en-US', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Year</label>
          <input className="form-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minWidth: 120 }} />
        </div>
        <div style={{ color: '#64748B', fontSize: 13, marginBottom: 6 }}>Today: {todayRecord ? statusLabel[todayRecord.status] : 'No record yet'}</div>
      </div>

      {(error || checkInMutation.error || checkOutMutation.error) && (
        <div className="card" style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', marginBottom: 16 }}>
          <p style={{ color: '#991B1B' }}>Unable to load or update attendance right now.</p>
        </div>
      )}

      {isLoading ? (
        <div className="card"><p style={{ color: '#64748B' }}>Loading attendance...</p></div>
      ) : sortedRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <p style={{ color: '#64748B' }}>No attendance records found for this month.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Check In</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Check Out</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Hours</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record: AttendanceRecord, index) => {
                const tone = statusColor[record.status];
                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid #E2E8F0', background: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: 12, color: '#0F172A', whiteSpace: 'nowrap' }}>{record.date}</td>
                    <td style={{ padding: 12, color: '#0F172A' }}>{formatTime(record.check_in)}</td>
                    <td style={{ padding: 12, color: '#0F172A' }}>{formatTime(record.check_out)}</td>
                    <td style={{ padding: 12, color: '#0F172A' }}>{record.working_hours ? record.working_hours.toFixed(2) : '—'}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.fg, fontSize: 12, fontWeight: 600 }}>
                        {statusLabel[record.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyAttendancePage;
