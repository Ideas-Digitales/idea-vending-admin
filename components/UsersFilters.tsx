'use client';

import { Search, X } from 'lucide-react';
import { UsersFilters } from '@/lib/interfaces/user.interface';

interface UsersFiltersProps {
  filters: UsersFilters;
  onFiltersChange: (filters: UsersFilters) => void;
}

export default function UsersFiltersComponent({ 
  filters, 
  onFiltersChange 
}: UsersFiltersProps) {

  // Handle search input
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchObj: {
        value: value,
        case_sensitive: false
      }
    });
  };

  return (
    <div className="py-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
        <input
          type="text"
          placeholder="Buscar usuarios por nombre, email o RUT..."
          value={filters.searchObj?.value || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-12 pr-12 py-3 text-lg text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-500"
        />
        {filters.searchObj?.value && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
