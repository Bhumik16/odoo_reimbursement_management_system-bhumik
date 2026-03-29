import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Users, Shield, BarChart3, CheckSquare, Receipt, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'employee';

  const menuItems = {
    admin: [
      { name: 'Users & Roles', path: '/admin/users', icon: Users },
      { name: 'Approval Rules', path: '/admin/rules', icon: Shield },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
    ],
    manager: [
      { name: 'Approvals', path: '/manager/approvals', icon: CheckSquare }
    ],
    employee: [
      { name: 'Expenses', path: '/employee/expenses', icon: Receipt }
    ]
  };

  const links = menuItems[role] || menuItems.employee;

  return (
    <aside className="w-[220px] h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <LayoutDashboard className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg text-text-primary tracking-tight">Reimburse</span>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
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

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={user?.name} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">{user?.name}</span>
            <span className="text-xs text-text-secondary capitalize">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
