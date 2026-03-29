import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './stores/authStore';

// Admin Pages
import { UsersPage } from './pages/admin/UsersPage';
import { RulesPage } from './pages/admin/RulesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

// Manager Pages
import { ApprovalQueue } from './pages/manager/ApprovalQueue';

// Employee Pages
import { ExpenseList } from './pages/employee/ExpenseList';

const queryClient = new QueryClient();

// A simple Role switcher component for demonstration purposes
const RoleSwitcher = () => {
  const { user, setUser } = useAuthStore();
  
  const switchRole = (role) => {
    setUser({ ...user, role });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-surface p-4 rounded-xl shadow-2xl border border-border z-50 flex gap-2">
      <span className="text-xs font-semibold self-center mr-2">Test role:</span>
      <button onClick={() => switchRole('admin')} className={`px-2 py-1 text-xs rounded ${user?.role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Admin</button>
      <button onClick={() => switchRole('manager')} className={`px-2 py-1 text-xs rounded ${user?.role === 'manager' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Manager</button>
      <button onClick={() => switchRole('employee')} className={`px-2 py-1 text-xs rounded ${user?.role === 'employee' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Employee</button>
    </div>
  );
};

function App() {
  const { user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/analytics';
      case 'manager': return '/manager/approvals';
      case 'employee': return '/employee/expenses';
      default: return '/employee/expenses';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          
          <Route element={<AppLayout />}>
            {/* Admin Routes */}
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/rules" element={<RulesPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            
            {/* Manager Routes */}
            <Route path="/manager/approvals" element={<ApprovalQueue />} />
            
            {/* Employee Routes */}
            <Route path="/employee/expenses" element={<ExpenseList />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RoleSwitcher />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
