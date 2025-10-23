'use client';

import { Search } from 'lucide-react';
import { useMachineFilters } from '../store/machineFilters';
import { getStatusName } from '../utils/machineHelpers';

export default function MachineSearchFilters() {
  const {
    searchTerm,
    statusFilter,
    typeFilter,
    setSearchTerm,
    setStatusFilter,
    setTypeFilter,
    clearFilters
  } = useMachineFilters();

  return (
    <div className="sticky top-20 z-50 bg-gray-50 py-4">
      <div className="px-6">
        <div className="card p-6 shadow-lg border-2 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-dark">🔍 Buscar Máquinas</h3>
            <div className="flex items-center text-xs text-primary font-medium">
              <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
              STICKY ACTIVO
            </div>
          </div>
          
          {/* Barra de búsqueda principal */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar máquinas por nombre, ubicación o tipo..."
                className="w-full pl-12 pr-4 py-4 text-lg text-dark placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtros secundarios */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              className="input-field flex-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Active">Activa</option>
              <option value="Inactive">Inactiva</option>
              <option value="Maintenance">Mantenimiento</option>
            </select>
            <select 
              className="input-field flex-1"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="MDB-DEX">MDB-DEX</option>
              <option value="EXECUTIVE">EXECUTIVE</option>
              <option value="CASHLESS">CASHLESS</option>
            </select>
          </div>
        
          {/* Filtros activos */}
          {(searchTerm || statusFilter || typeFilter) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Búsqueda: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-2 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Estado: {getStatusName(statusFilter)}
                  <button 
                    onClick={() => setStatusFilter('')}
                    className="ml-2 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Tipo: {typeFilter}
                  <button 
                    onClick={() => setTypeFilter('')}
                    className="ml-2 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              <button 
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
