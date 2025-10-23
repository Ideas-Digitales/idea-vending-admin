'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { type Maquina, type MachinesResponse } from '../serveractions/machines';
import { useInfiniteScrollMachines } from '../hooks/useInfiniteScrollMachines';
import { useScrollToBottom } from '@/lib/hooks/useInfiniteScroll';
import { useMachineFilters } from '../store/machineFilters';
import { calculateMachineStats } from '../utils/machineHelpers';
import MachineHeader from './MachineHeader';
import MachineStatsCards from './MachineStatsCards';
import MachineSearchFilters from './MachineSearchFilters';
import MachineTable from './MachineTable';

interface MachineInfiniteClientProps {
  initialMachines: Maquina[];
  initialPagination?: MachinesResponse['pagination'];
}

export default function MachineInfiniteClient({ 
  initialMachines, 
  initialPagination 
}: MachineInfiniteClientProps) {
  const {
    searchTerm,
    statusFilter,
    typeFilter,
    debouncedSearchTerm,
    setDebouncedSearchTerm
  } = useMachineFilters();

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, setDebouncedSearchTerm]);

  // Filtros para la API (solo cuando el debounce está completo)
  const apiFilters = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  }), [debouncedSearchTerm, statusFilter, typeFilter]);

  // Hook de scroll infinito
  const {
    machines,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScrollMachines({
    initialMachines,
    initialPagination,
    filters: {},
  });

  // Refrescar cuando cambien los filtros del servidor
  useEffect(() => {
    if (debouncedSearchTerm || statusFilter || typeFilter) {
      refresh(apiFilters);
    }
  }, [debouncedSearchTerm, statusFilter, typeFilter, apiFilters, refresh]);

  // Hook para detectar scroll al final
  useScrollToBottom(useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]));

  // Filtrado local (solo para búsqueda instantánea)
  const displayedMachines = useMemo(() => {
    if (!searchTerm) {
      return machines;
    }
    
    if (searchTerm !== debouncedSearchTerm) {
      return machines.filter(maquina => 
        maquina.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maquina.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maquina.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return machines;
  }, [machines, searchTerm, debouncedSearchTerm]);

  // Calcular estadísticas
  const stats = calculateMachineStats(displayedMachines);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-auto">
        <MachineHeader />

        <div className="relative">
          <MachineStatsCards stats={stats} totalCount={totalCount} />
          <MachineSearchFilters />

          {/* Error State */}
          {error && (
            <div className="px-6 py-4">
              <div className="card p-6 bg-red-50 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error al cargar máquinas</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button 
                    onClick={() => refresh(apiFilters)}
                    className="ml-auto btn-secondary text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Machines Table */}
          <div className="px-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">
                    Lista de Máquinas 
                    {displayedMachines.length !== machines.length && (
                      <span className="text-sm font-normal text-muted ml-2">
                        ({displayedMachines.length} de {machines.length} mostradas)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full mr-2">API</span>
                      <span className="text-muted">Datos reales</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full mr-2">MOCK</span>
                      <span className="text-muted">Pendiente en API</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <MachineTable machines={displayedMachines} loading={loading} />
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="px-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted">Cargando más máquinas...</span>
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && machines.length > 0 && (
            <div className="px-6">
              <div className="text-center py-8">
                <p className="text-muted">Has visto todas las máquinas disponibles</p>
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
