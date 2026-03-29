import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * ProtectedRoute
 * - Redirects to /login if not authenticated
 * - Optionally restricts to specific roles
 */
export const ProtectedRoute = ({ roles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the correct dashboard for their role
    if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/employee/expenses" replace />;
  }

  return <Outlet />;
};
