import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ children, className }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className={cn("w-full text-left text-sm text-text-primary", className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className }) => {
  return (
    <thead className={cn("bg-gray-50 border-b border-border text-text-secondary text-xs uppercase tracking-wider", className)}>
      {children}
    </thead>
  );
};

export const TableRow = ({ children, className, expandable = false }) => {
  return (
    <tr className={cn("border-b border-border last:border-0 hover:bg-gray-50 transition-colors", expandable && "cursor-pointer", className)}>
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className }) => {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap", className)}>
      {children}
    </td>
  );
};

export const TableHead = ({ children, className }) => {
  return (
    <th className={cn("px-6 py-4 font-medium", className)}>
      {children}
    </th>
  );
};
