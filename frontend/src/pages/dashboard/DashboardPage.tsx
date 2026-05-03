import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { LeaveDistributionChart } from '@/components/dashboard/LeaveDistributionChart';
import { analyticsApi } from '@/api/analytics.api';

import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { PayrollOfficerDashboard } from '@/components/dashboard/PayrollOfficerDashboard';

const DashboardPage: React.FC = () => {
  const authStore = useAuthStore();
  const [currentDate] = useState(new Date());

  // Admin/HR Queries
  const { data: adminAnalytics, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminAnalytics,
    enabled: ['admin', 'hr_officer'].includes(authStore.role as string),
  });

  const { data: monthlyAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['monthly-attendance', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: () =>
      analyticsApi.getMonthlyAttendance(currentDate.getMonth() + 1, currentDate.getFullYear()),
    enabled: ['admin', 'hr_officer'].includes(authStore.role as string),
  });

  const { data: leaveDistribution, isLoading: leaveLoading } = useQuery({
    queryKey: ['leave-distribution'],
    queryFn: analyticsApi.getLeaveDistribution,
    enabled: ['admin', 'hr_officer'].includes(authStore.role as string),
  });

  // ADMIN DASHBOARD
  if (authStore.role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Organization Overview</p>
        </div>

        {/* Stats Cards */}
        {adminLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              icon={<Users size={24} />}
              value={adminAnalytics?.total_employees || 0}
              label="Total Employees"
              color="blue"
            />
            <StatCard
              icon={<CheckCircle size={24} />}
              value={adminAnalytics?.present_today || 0}
              label="Present Today"
              color="green"
            />
            <StatCard
              icon={<Calendar size={24} />}
              value={adminAnalytics?.half_day_today || 0}
              label="Half Day Today"
              color="red"
            />
            <StatCard
              icon={<Clock size={24} />}
              value={adminAnalytics?.pending_leaves || 0}
              label="Pending Leaves"
              color="orange"
            />
            <StatCard
              icon={<DollarSign size={24} />}
              value={adminAnalytics?.processed_payruns || 0}
              label="Processed Payruns"
              color="purple"
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {attendanceLoading ? (
            <div className="bg-gray-200 rounded-lg h-80"></div>
          ) : (
            monthlyAttendance?.weeks && <AttendanceChart data={monthlyAttendance.weeks} />
          )}
          {leaveLoading ? (
            <div className="bg-gray-200 rounded-lg h-80"></div>
          ) : (
            leaveDistribution?.distribution && (
              <LeaveDistributionChart data={leaveDistribution.distribution} />
            )
          )}
        </div>
      </div>
    );
  }

  // HR OFFICER DASHBOARD
  if (authStore.role === 'hr_officer') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">HR Management Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={24} />}
            value={adminAnalytics?.total_employees || 0}
            label="Total Employees"
            color="blue"
          />
          <StatCard
            icon={<CheckCircle size={24} />}
            value={adminAnalytics?.present_today || 0}
            label="Present Today"
            color="green"
          />
          <StatCard
            icon={<Clock size={24} />}
            value={adminAnalytics?.pending_leaves || 0}
            label="Pending Leaves"
            color="orange"
          />
          <StatCard
            icon={<Calendar size={24} />}
            value={adminAnalytics?.half_day_today || 0}
            label="Half Day Today"
            color="red"
          />
        </div>

        {attendanceLoading ? (
          <div className="bg-gray-200 rounded-lg h-80"></div>
        ) : (
          monthlyAttendance?.weeks && (
            <AttendanceChart
              data={monthlyAttendance.weeks}
              title="Attendance Overview"
            />
          )
        )}
      </div>
    );
  }

  // PAYROLL OFFICER DASHBOARD
  if (authStore.role === 'payroll_officer') {
    return <PayrollOfficerDashboard />;
  }

  // EMPLOYEE DASHBOARD
  if (authStore.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return (
    <div className="text-center py-12">
      <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
      <p className="text-gray-600">Unable to load dashboard for your role</p>
    </div>
  );
};

export default DashboardPage;
