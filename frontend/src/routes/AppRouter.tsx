import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import ProtectedRoute from './ProtectedRoute';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages (lazy-loaded placeholders)
import DashboardPage from '@/pages/dashboard/DashboardPage';
import EmployeeListPage from '@/pages/employees/EmployeeListPage';
import EmployeeFormPage from '@/pages/employees/EmployeeFormPage';
import EmployeeDetailPage from '@/pages/employees/EmployeeDetailPage';
import MyAttendancePage from '@/pages/attendance/MyAttendancePage';
import AllAttendancePage from '@/pages/attendance/AllAttendancePage';
import MyLeavePage from '@/pages/leave/MyLeavePage';
import LeaveManagementPage from '@/pages/leave/LeaveManagementPage';
import LeaveApprovalsPage from '@/pages/leave/LeaveApprovalsPage';
import PayrunPage from '@/pages/payroll/PayrunPage';
import PayslipListPage from '@/pages/payroll/PayslipListPage';
import PayslipDetailPage from '@/pages/payroll/PayslipDetailPage';

import { Role } from '@/constants/roles';

const ALL_ROLES = [Role.ADMIN, Role.EMPLOYEE, Role.HR_OFFICER, Role.PAYROLL_OFFICER];
const MANAGER_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER];
const HR_ROLES = [Role.ADMIN, Role.HR_OFFICER];
const PAYROLL_ROLES = [Role.ADMIN, Role.PAYROLL_OFFICER];

const UnauthorizedPage = () => (
  <div className="flex items-center justify-center min-h-screen flex-col gap-4">
    <h1 className="text-2xl font-bold text-slate-800">403 — Access Denied</h1>
    <p className="text-slate-500">You don't have permission to view this page.</p>
    <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
  </div>
);

const AppRouter: React.FC = () => {
  const { token, isAuthenticated, setUser } = useAuthStore();

  // Re-hydrate user on app load
  useEffect(() => {
    if (token && !isAuthenticated) {
      authApi.me().then(setUser).catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected — all roles */}
        <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/new" element={<EmployeeFormPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
            <Route path="/attendance/my" element={<MyAttendancePage />} />
            <Route path="/leave/my" element={<MyLeavePage />} />
          </Route>
        </Route>

        {/* Manager-only routes */}
        <Route element={<ProtectedRoute allowedRoles={MANAGER_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path="/attendance/all" element={<AllAttendancePage />} />
          </Route>
        </Route>

        {/* HR routes */}
        <Route element={<ProtectedRoute allowedRoles={HR_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path="/leave/manage" element={<LeaveManagementPage />} />
          </Route>
        </Route>

        {/* Payroll routes */}
        <Route element={<ProtectedRoute allowedRoles={PAYROLL_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
            <Route path="/payroll/run" element={<PayrunPage />} />
            <Route path="/payroll/payslips" element={<PayslipListPage />} />
            <Route path="/payroll/payslips/:id" element={<PayslipDetailPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
