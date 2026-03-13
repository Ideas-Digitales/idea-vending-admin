'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Building2, X, ChevronDown } from 'lucide-react';
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

interface EnterpriseSearchInputProps {
  selectedEnterpriseId?: number | null;
  onEnterpriseSelect: (enterprise: Enterprise | null) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export default function EnterpriseSearchInput({
  selectedEnterpriseId,
  onEnterpriseSelect,
  error,
  disabled = false,
  placeholder = 'Buscar empresa por nombre o RUT...',
  compact = false,
}: EnterpriseSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Inicialización controlada desde selectedEnterpriseId
  const initializedRef = useRef(false);
  const prevSelectedIdRef = useRef<number | null | undefined>(undefined);

  const fetchEnterprises = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const response = await getEnterprisesAction({
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
      });
      setEnterprises(response.success ? (response.enterprises ?? []) : []);
    } catch {
      setEnterprises([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Búsqueda con debounce al escribir
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchEnterprises(searchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchEnterprises]);

  // Inicialización desde selectedEnterpriseId; se re-inicializa si el prop cambia externamente
  useEffect(() => {
    if (prevSelectedIdRef.current !== selectedEnterpriseId) {
      initializedRef.current = false;
      prevSelectedIdRef.current = selectedEnterpriseId;
    }

    if (initializedRef.current || enterprises.length === 0) return;

    if (!selectedEnterpriseId) {
      initializedRef.current = true;
      setSelectedEnterprise(null);
      setSearchTerm('');
      return;
    }

    const found = enterprises.find((e) => e.id === selectedEnterpriseId);
    if (found) {
      initializedRef.current = true;
      setSelectedEnterprise(found);
      setSearchTerm(found.name);
    }
  }, [selectedEnterpriseId, enterprises]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(true);

    if (!value.trim()) {
      setSelectedEnterprise(null);
      onEnterpriseSelect(null);
    } else if (selectedEnterprise && !selectedEnterprise.name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedEnterprise(null);
      onEnterpriseSelect(null);
    }
  };

  const handleEnterpriseSelect = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setSearchTerm(enterprise.name);
    setIsOpen(false);
    onEnterpriseSelect(enterprise);
  };

  const handleClear = () => {
    setSelectedEnterprise(null);
    setSearchTerm('');
    onEnterpriseSelect(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            input-field w-full pl-10 pr-10
            ${compact ? '!py-2 !text-sm !rounded-lg' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selectedEnterprise && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {selectedEnterprise && !compact && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">{selectedEnterprise.name}</p>
              <p className="text-xs text-blue-700 truncate">{selectedEnterprise.rut}</p>
            </div>
            <span className="text-xs text-blue-600 font-medium">ID: {selectedEnterprise.id}</span>
          </div>
        </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500">Buscando empresas...</p>
            </div>
          ) : enterprises.length > 0 ? (
            <div className="py-1">
              {enterprises.map((enterprise) => (
                <button
                  key={enterprise.id}
                  type="button"
                  onClick={() => handleEnterpriseSelect(enterprise)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{enterprise.name}</p>
                      <p className="text-xs text-gray-500 truncate">{enterprise.rut}</p>
                      <p className="text-xs text-gray-400">ID: {enterprise.id}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center">
              <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No se encontraron empresas</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Escribe para buscar empresas</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
