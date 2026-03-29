import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ children, status = 'default', className }) => {
  const statusStyles = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-primary-light text-primary border-blue-200',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        statusStyles[status.toLowerCase()] || statusStyles.default,
        className
      )}
    >
      {children}
    </span>
  );
};
