'use client';

import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  activeTags?: React.ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeTags,
}: FilterBarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-4 w-4 text-primary/70 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,87,178,0.12)]"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {filters && <div className="w-full sm:w-auto shrink-0">{filters}</div>}
      </div>
      {activeTags && <div className="flex flex-wrap gap-2 items-center">{activeTags}</div>}
    </div>
  );
}
