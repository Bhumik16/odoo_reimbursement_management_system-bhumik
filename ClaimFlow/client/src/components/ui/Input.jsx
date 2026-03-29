import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border bg-surface px-4 py-2 text-text-primary placeholder:text-text-secondary outline-none transition-all",
          "focus:border-primary focus:ring-2 focus:ring-primary-light",
          "disabled:opacity-50 disabled:bg-gray-50",
          Icon && "pl-10",
          error && "border-error focus:border-error focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
