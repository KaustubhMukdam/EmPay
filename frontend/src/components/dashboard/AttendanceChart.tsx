import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface WeekData {
  week_label: string;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
}

interface AttendanceChartProps {
  data: WeekData[];
  title?: string;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  data,
  title = 'Monthly Attendance',
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week_label" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Bar dataKey="present" fill="#10b981" name="Present" />
          <Bar dataKey="absent" fill="#ef4444" name="Absent" />
          <Bar dataKey="half_day" fill="#f59e0b" name="Half Day" />
          <Bar dataKey="on_leave" fill="#8b5cf6" name="On Leave" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
