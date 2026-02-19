'use client';

import { Search, X } from 'lucide-react';
import { UsersFilters } from '@/lib/interfaces/user.interface';

interface UsersFiltersProps {
  filters: UsersFilters;
  onFiltersChange: (filters: UsersFilters) => void;
  isAdmin?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'customer',   label: 'Cliente'        },
  { value: 'technician', label: 'Técnico'        },
];

export default function UsersFiltersComponent({
  filters,
  onFiltersChange,
  isAdmin = false,
}: UsersFiltersProps) {

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchObj: { value, case_sensitive: false },
    });
  };

  const selectedRole = filters.scopes?.find(s => s.name === 'whereRole')?.parameters[0] ?? '';

  const handleRoleChange = (role: string) => {
    onFiltersChange({
      ...filters,
      scopes: role === selectedRole
        ? []
        : [{ name: 'whereRole', parameters: [role] }],
    });
  };

  const hasActiveFilters = !!(filters.searchObj?.value || selectedRole);

  return (
    <div className="py-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Búsqueda por texto */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUT..."
            value={filters.searchObj?.value || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-400"
          />
          {filters.searchObj?.value && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro por rol — pills, solo para admins */}
        {isAdmin && (
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shrink-0">
            {ROLE_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => handleRoleChange(opt.value)}
                className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                  i > 0 ? 'border-l border-gray-300' : ''
                } ${
                  selectedRole === opt.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chip de búsqueda activa + limpiar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.searchObj?.value && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              &quot;{filters.searchObj.value}&quot;
              <button onClick={() => handleSearchChange('')} className="hover:text-blue-600 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              handleSearchChange('');
              handleRoleChange('');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
