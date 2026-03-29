import React from 'react';
import { cn } from '../../lib/utils';

export const Avatar = ({ name, size = 'md', className }) => {
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-light text-primary font-bold shrink-0",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
