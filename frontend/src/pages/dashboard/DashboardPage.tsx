import React from 'react';
import { useAuthStore } from '@/store/authStore';

const DashboardPage: React.FC = () => {
  const { role, user } = useAuthStore();
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}!</p>
        </div>
      </div>
      <div className="card">
        <p style={{ color: '#64748B' }}>Dashboard for <strong>{role}</strong> — full implementation coming in Phase 6.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
