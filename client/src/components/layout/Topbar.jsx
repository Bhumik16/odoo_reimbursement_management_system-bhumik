import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar = ({ title, primaryAction }) => {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0 sticky top-0 z-40">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-primary-light/50">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error ring-2 ring-surface"></span>
        </button>
      </div>
    </header>
  );
};
