import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './stores/authStore';

// Auth Pages
import { RegisterCompanyPage } from './pages/auth/RegisterCompanyPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RoleRedirect } from './components/layout/RoleRedirect';

// Admin Pages
import { UsersPage } from './pages/admin/UsersPage';
import { RulesPage } from './pages/admin/RulesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

// Manager Pages
import { ApprovalQueue } from './pages/manager/ApprovalQueue';

// Employee Pages
import { ExpenseList } from './pages/employee/ExpenseList';

const queryClient = new QueryClient();

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <RoleRedirect />;
  }

  return <Outlet />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth Routes */}
          <Route path="/register-company" element={<RegisterCompanyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />
          
          <Route element={<AppLayout />}>
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/rules" element={<RulesPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Manager Routes (Admin and Manager) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
              <Route path="/manager/approvals" element={<ApprovalQueue />} />
            </Route>

            {/* Employee Routes (Everyone needs expenses) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />}>
              <Route path="/employee/expenses" element={<ExpenseList />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
