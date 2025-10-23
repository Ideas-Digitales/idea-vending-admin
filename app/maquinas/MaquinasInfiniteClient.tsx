'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Monitor, Plus, Search, Edit, Trash2, Eye, Wifi, WifiOff, AlertTriangle, MapPin, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { type Maquina, type MachinesResponse } from '@/lib/actions/machines';
import { useInfiniteScrollMachines } from '@/lib/hooks/useInfiniteScrollMachines';
import { useScrollToBottom } from '@/lib/hooks/useInfiniteScroll';

interface MaquinasInfiniteClientProps {
  initialMachines: Maquina[];
  initialPagination?: MachinesResponse['pagination'];
}

export default function MaquinasInfiniteClient({ 
  initialMachines, 
  initialPagination 
}: MaquinasInfiniteClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  
  const filtersRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtros para la API (solo cuando el debounce está completo)
  const apiFilters = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  }), [debouncedSearchTerm, statusFilter, typeFilter]);

  // Hook de scroll infinito (sin filtros automáticos)
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
    filters: {}, // Sin filtros automáticos
  });

  // Refrescar solo cuando los filtros de servidor cambien
  const prevFiltersRef = useRef(apiFilters);
  useEffect(() => {
    // Solo refrescar si los filtros realmente cambiaron
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(apiFilters);
    if (filtersChanged && (debouncedSearchTerm || statusFilter || typeFilter)) {
      refresh(apiFilters);
      prevFiltersRef.current = apiFilters;
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
    // Si no hay término de búsqueda, mostrar todas las máquinas
    if (!searchTerm) {
      return machines;
    }
    
    // Si el término de búsqueda es diferente al debounced, hacer filtrado local instantáneo
    if (searchTerm !== debouncedSearchTerm) {
      return machines.filter(maquina => 
        maquina.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maquina.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maquina.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Si el término coincide con el debounced, mostrar las máquinas del servidor
    return machines;
  }, [machines, searchTerm, debouncedSearchTerm]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, connectionStatus: boolean) => {
    if (!connectionStatus) return <WifiOff className="h-4 w-4" />;
    
    switch (status.toLowerCase()) {
      case 'active': return <Wifi className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  // Calcular estadísticas
  const stats = {
    total: displayedMachines.length,
    active: displayedMachines.filter(m => m.status.toLowerCase() === 'active').length,
    maintenance: displayedMachines.filter(m => m.status.toLowerCase() === 'maintenance').length,
    offline: displayedMachines.filter(m => !m.connection_status).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
                  <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
                </div>
              </div>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nueva Máquina</span>
              </button>
            </div>
          </div>
        </header>

        <div className="relative">
          {/* Stats Cards */}
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted mb-2">Total Máquinas</p>
                    <p className="text-2xl font-bold text-dark">{stats.total}</p>
                    {totalCount > 0 && stats.total !== totalCount && (
                      <p className="text-xs text-muted mt-1">de {totalCount} total</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-4">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted mb-2">Activas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 flex-shrink-0 ml-4">
                    <Wifi className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted mb-1">Mantenimiento</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-50">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted mb-1">Sin Conexión</p>
                    <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <WifiOff className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters - Sticky */}
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
                
                {/* Barra de búsqueda principal - MÁS GRANDE */}
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
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setTypeFilter('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>

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
              
              {displayedMachines.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark mb-2">No se encontraron máquinas</h3>
                  <p className="text-muted">
                    {machines.length === 0 
                      ? 'No hay máquinas registradas en el sistema.'
                      : 'Intenta ajustar los filtros de búsqueda.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Máquina
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Ubicación
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Tipo
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Estado
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Conexión
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Última Actualización
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedMachines.map((maquina) => (
                        <tr key={maquina.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                                <Monitor className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-dark">{maquina.name}</div>
                                <div className="text-sm text-muted">ID: {maquina.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-dark">{maquina.location}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {maquina.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(maquina.status)}`}>
                              {getStatusName(maquina.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(maquina.status, maquina.connection_status)}
                              <span className={`ml-2 text-sm ${maquina.connection_status ? 'text-green-600' : 'text-red-600'}`}>
                                {maquina.connection_status ? 'Conectada' : 'Desconectada'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(maquina.updated_at).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Editar máquina"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar máquina"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
