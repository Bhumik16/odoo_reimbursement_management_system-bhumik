import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Admin
import { UsersPage } from './pages/admin/UsersPage';
import { RulesPage } from './pages/admin/RulesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

// Manager
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ApprovalQueue } from './pages/manager/ApprovalQueue';

// Employee
import { ExpenseList } from './pages/employee/ExpenseList';
import { ExpenseDetail } from './pages/employee/ExpenseDetail';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function App() {
  const { user } = useAuthStore();

  const defaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/analytics';
    if (user.role === 'manager') return '/manager/dashboard';
    return '/employee/expenses';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/rules" element={<RulesPage />} />
            </Route>
          </Route>

          {/* Manager */}
          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route element={<AppLayout />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/approvals" element={<ApprovalQueue />} />
            </Route>
          </Route>

          {/* Employee */}
          <Route element={<ProtectedRoute roles={['employee']} />}>
            <Route element={<AppLayout />}>
              <Route path="/employee/expenses" element={<ExpenseList />} />
              <Route path="/employee/expenses/:id" element={<ExpenseDetail />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={defaultRoute()} replace />} />
          <Route path="*" element={<Navigate to={defaultRoute()} replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
