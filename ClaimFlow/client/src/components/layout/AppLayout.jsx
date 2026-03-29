import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, useLocation } from 'react-router-dom';

export const AppLayout = () => {
  const location = useLocation();
  
  const getPageTitle = (path) => {
    if (path.includes('/admin/users')) return 'Users & Roles';
    if (path.includes('/admin/rules')) return 'Approval Rules';
    if (path.includes('/admin/analytics')) return 'Analytics';
    if (path.includes('/manager/approvals')) return 'Approval Queue';
    if (path.includes('/employee/expenses')) return 'My Expenses';
    return 'Dashboard';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[220px]">
        <Topbar title={title} />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
