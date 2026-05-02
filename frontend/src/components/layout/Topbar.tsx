import React from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/constants/roles';

const Topbar: React.FC = () => {
  const { user, role } = useAuthStore();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="topbar">
      <div>
        <div style={{ fontSize: 13, color: '#94A3B8' }}>{dateStr}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #E2E8F0', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748B',
        }}>
          <Bell size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{role ? ROLE_LABELS[role] : ''}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
