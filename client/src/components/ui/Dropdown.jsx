import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';
import { Input } from './Input';

export const Dropdown = ({ trigger, items = [], onSelect, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-[260px] origin-top-right rounded-xl bg-surface shadow-soft ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-3 border-b border-border">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
                className="h-9 text-sm"
              />
            </div>
          )}
          <div className="py-2 max-h-60 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-secondary text-center">No items found</div>
            ) : (
              filteredItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect && onSelect(item);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    item.active
                      ? "bg-primary-light text-primary font-medium"
                      : "text-text-primary hover:bg-[#EFF6FF]"
                  )}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
