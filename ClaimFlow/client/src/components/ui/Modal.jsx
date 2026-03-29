import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, type = 'modal' }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center">
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div 
        className={cn(
          "relative bg-surface shadow-2xl transition-transform w-full",
          type === 'slide' 
            ? "h-full max-w-md sm:translate-x-0 ml-auto animate-in slide-in-from-right" 
            : "rounded-2xl max-w-lg m-4 animate-in zoom-in-95"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn("p-6 overflow-y-auto", type === 'slide' ? "h-[calc(100vh-73px)]" : "max-h-[80vh]")}>
          {children}
        </div>
      </div>
    </div>
  );
};
