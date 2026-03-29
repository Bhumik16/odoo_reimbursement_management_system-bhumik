import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const RoleRedirect = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/users" replace />;
  } else if (user.role === 'manager') {
    return <Navigate to="/manager/approvals" replace />;
  } else {
    // defaults to employee
    return <Navigate to="/employee/expenses" replace />;
  }
};
