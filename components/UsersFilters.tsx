'use client';

import { Search, X } from 'lucide-react';
import { UsersFilters } from '@/lib/interfaces/user.interface';

interface UsersFiltersProps {
  filters: UsersFilters;
  onFiltersChange: (filters: UsersFilters) => void;
  onClearAll: () => void;
}

export default function UsersFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearAll 
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

  const hasSearch = filters.searchObj?.value;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar usuarios por nombre..."
            value={filters.searchObj?.value || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-600"
          />
          {filters.searchObj?.value && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {hasSearch && (
          <button
            onClick={onClearAll}
            className="px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
