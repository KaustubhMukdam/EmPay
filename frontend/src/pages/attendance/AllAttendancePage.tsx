import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { attendanceApi } from '@/api/attendance.api';
import { employeeApi } from '@/api/employees.api';
import type { AttendanceStatus } from '@/types/attendance.types';

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

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

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

const AllAttendancePage: React.FC = () => {
  const { user } = useAuthStore();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: records = [], isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ['attendance', 'all', user?.id, month, year],
    queryFn: () => attendanceApi.getAllAttendance(month, year),
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.listEmployees(),
  });

  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  const filteredRecords = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return [...records]
      .filter((record) => {
        const employee = employeeById.get(record.employee_id);
        if (!needle) return true;
        return [
          employee?.name,
          employee?.email,
          employee?.employee_code,
          employee?.department,
          employee?.designation,
          record.date,
          statusLabel[record.status],
        ].some((value) => value?.toLowerCase().includes(needle));
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [records, employeeById, search]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage]);

  const summary = useMemo(() => ({
    records: records.length,
    present: records.filter((record) => record.status === 'present').length,
    halfDay: records.filter((record) => record.status === 'half_day').length,
    onLeave: records.filter((record) => record.status === 'on_leave').length,
  }), [records]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
        <div>
          <h1 className="page-title">All Attendance</h1>
          <p className="page-subtitle">View attendance logs in your local timezone for the selected month.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Records', value: summary.records },
          { label: 'Present', value: summary.present },
          { label: 'Half Day', value: summary.halfDay },
          { label: 'On Leave', value: summary.onLeave },
        ].map((item) => (
          <div key={item.label} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#F8FAFC' }}>
            <div style={{ color: '#64748B', fontSize: 13, marginBottom: 10 }}>{item.label}</div>
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
        <div style={{ flex: 1, minWidth: 240 }}>
          <label className="form-label">Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="form-input"
              placeholder="Employee code, department, designation, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
      </div>

      {(recordsError || (employeesLoading && !employees.length)) && (
        <div className="card" style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', marginBottom: 16 }}>
          <p style={{ color: '#991B1B' }}>Unable to load attendance data.</p>
        </div>
      )}

      {recordsLoading ? (
        <div className="card"><p style={{ color: '#64748B' }}>Loading attendance...</p></div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <p style={{ color: '#64748B' }}>No attendance records match the selected filters.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Employee</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Department</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Check In</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Check Out</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Hours</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => {
                  const employee = employeeById.get(record.employee_id);
                  const tone = statusColor[record.status];
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #E2E8F0', background: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: 12, color: '#0F172A' }}>
                        <div style={{ fontWeight: 600 }}>{employee?.employee_code || 'Unknown employee'}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{employee?.name}</div>
                      </td>
                      <td style={{ padding: 12, color: '#0F172A' }}>{employee?.department || '—'}</td>
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 12px 12px' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Page {currentPage} of {totalPages} ({filteredRecords.length} results)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm"
                  style={{ background: '#F1F5F9', color: '#1E293B' }}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#F1F5F9', color: '#1E293B' }}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllAttendancePage;
