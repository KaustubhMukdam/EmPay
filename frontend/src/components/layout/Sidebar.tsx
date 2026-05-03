import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, Calendar, DollarSign,
  FileText, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Role, ROLE_LABELS } from '@/constants/roles';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: Role[];
}

const ALL_ROLES = [Role.ADMIN, Role.EMPLOYEE, Role.HR_OFFICER, Role.PAYROLL_OFFICER];

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',       icon: <LayoutDashboard size={18} />, label: 'Dashboard',        roles: ALL_ROLES },
  { to: '/employees',       icon: <Users size={18} />,           label: 'Employees',         roles: ALL_ROLES },
  { to: '/attendance/my',   icon: <Clock size={18} />,           label: 'My Attendance',     roles: ALL_ROLES },
  { to: '/attendance/all',  icon: <Clock size={18} />,           label: 'All Attendance',    roles: [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER] },
  { to: '/leave/my',        icon: <Calendar size={18} />,        label: 'My Leave',          roles: ALL_ROLES },
  { to: '/leave/manage',    icon: <Calendar size={18} />,        label: 'Leave Management',  roles: [Role.ADMIN, Role.HR_OFFICER] },
  { to: '/leave/approvals', icon: <Calendar size={18} />,        label: 'Leave Approvals',   roles: [Role.ADMIN, Role.PAYROLL_OFFICER] },
  { to: '/payroll/run',     icon: <DollarSign size={18} />,      label: 'Payroll',           roles: [Role.ADMIN, Role.PAYROLL_OFFICER] },
  { to: '/payroll/payslips',icon: <FileText size={18} />,        label: 'Payslips',          roles: [Role.ADMIN, Role.PAYROLL_OFFICER, Role.EMPLOYEE] },
];

const Sidebar: React.FC = () => {
  const { role, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item =>
    role && item.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'white',
          }}>E</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>EmPay</div>
            <div style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>HRMS Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          marginBottom: 8,
        }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ color: '#64748B', fontSize: 11 }}>
              {role ? ROLE_LABELS[role] : ''}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
