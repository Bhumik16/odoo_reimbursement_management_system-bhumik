import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Users, Shield, BarChart3, CheckSquare, Receipt, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const role = user?.role || 'employee';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    admin: [
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'Users & Roles', path: '/admin/users', icon: Users },
      { name: 'Approval Rules', path: '/admin/rules', icon: Shield },
      { name: 'My Expenses', path: '/employee/expenses', icon: Receipt }, /* Admins can be employees */
    ],
    manager: [
      { name: 'Approval Queue', path: '/manager/approvals', icon: CheckSquare },
      { name: 'My Expenses', path: '/employee/expenses', icon: Receipt }
    ],
    employee: [
      { name: 'My Expenses', path: '/employee/expenses', icon: Receipt }
    ]
  };

  const links = menuItems[role] || menuItems.employee;

  return (
    <aside className="w-[220px] bg-surface h-screen border-r border-border flex flex-col fixed left-0 top-0">
      <div className="h-16 flex shrink-0 items-center px-6 border-b border-border">
        <LayoutDashboard className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg text-text-primary tracking-tight">Reimburse</span>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Main Menu</p>
        <nav className="flex-1 space-y-1">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                isActive 
                  ? "bg-primary-light text-primary" 
                  : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="flex flex-col flex-1 truncate">
            <span className="text-sm font-medium text-text-primary truncate">{user?.name}</span>
            <span className="text-xs text-text-secondary capitalize">{role}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-error hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
