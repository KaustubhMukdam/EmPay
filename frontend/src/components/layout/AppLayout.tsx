import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="page-content" style={{ flex: 1 }}>
        <Topbar />
        <main className="page-inner fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
