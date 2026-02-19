'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, X, ChevronDown } from 'lucide-react';
import { useUserStore } from '@/lib/stores/userStore';
import type { User as UserType } from '@/lib/interfaces/user.interface';
import { ROLE_LABELS } from '@/lib/constants/roles';
import type { UserRole } from '@/lib/constants/roles';

interface UserSearchInputProps {
  selectedUserId?: number | null;
  onUserSelect: (user: UserType | null) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function UserSearchInput({
  selectedUserId,
  onUserSelect,
  error,
  disabled = false,
  placeholder = "Buscar usuario por nombre o email..."
}: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { users, isLoading, fetchUsers } = useUserStore();

  // Load users on mount and when search term changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters = {
        page: 1,
        limit: 50,
        searchObj: {
          value: searchTerm.trim(),
          case_sensitive: false
        },
        filters: []
      };
      
      fetchUsers(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchUsers]);

  // Find selected user when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId);
      if (user && !selectedUser) {
        // Solo actualizar si no hay usuario seleccionado actualmente
        setSelectedUser(user);
        setSearchTerm(user.name);
      }
    } else if (!selectedUserId && selectedUser) {
      // Solo limpiar si había un usuario seleccionado
      setSelectedUser(null);
      // No limpiar searchTerm aquí para permitir búsqueda libre
    }
  }, [selectedUserId, users, selectedUser]);

  // Close dropdown when clicking outside
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
    
    // Clear selection if input is cleared or if typing doesn't match selected user
    if (!value.trim()) {
      setSelectedUser(null);
      onUserSelect(null);
    } else if (selectedUser && !selectedUser.name.toLowerCase().includes(value.toLowerCase())) {
      // Si el usuario está escribiendo algo que no coincide con el usuario seleccionado
      setSelectedUser(null);
      onUserSelect(null);
    }
  };

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setSearchTerm(user.name);
    setIsOpen(false);
    onUserSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearchTerm('');
    onUserSelect(null);
    inputRef.current?.focus();
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            input-field pl-10 pr-10
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selectedUser && !disabled ? (
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

      {/* Selected User Info */}
      {selectedUser && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">{selectedUser.name}</p>
              <p className="text-xs text-blue-700 truncate">{selectedUser.email}</p>
            </div>
            <span className="text-xs text-blue-600 font-medium">ID: {selectedUser.id}</span>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Buscando usuarios...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="py-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        {ROLE_LABELS[user.role as UserRole] ?? 'Usuario'} • ID: {user.id}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No se encontraron usuarios</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Escribe para buscar usuarios</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
