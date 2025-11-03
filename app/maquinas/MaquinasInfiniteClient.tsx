'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Monitor, Plus, Search, Edit, Trash2, Eye, Wifi, WifiOff, Loader2, AlertCircle, MapPin } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useMachineStore } from '@/lib/stores/machineStore';
import UserStorePagination from '@/components/UserStorePagination';
import { notify } from '@/lib/adapters/notification.adapter';
import { MachineAdapter } from '@/lib/adapters/machine.adapter';

export default function MaquinasInfiniteClient() {
  const router = useRouter();

  // Store state
  const {
    machines,
    isLoading,
    error,
    fetchMachines,
    refreshMachines,
    setFilters,
    clearError,
    deleteMachine,
    isDeleting,
    deleteError,
    clearDeleteError,
    getTotalMachines,
    getTotalActiveMachines,
    getTotalMaintenanceMachines,
    getTotalInactiveMachines,
    getTotalConnectedMachines,
  } = useMachineStore();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    machineId: number | string | null;
    machineName: string;
  }>({
    isOpen: false,
    machineId: null,
    machineName: ''
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0,
    connected: 0,
    isLoading: false
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch machines when filters change
  useEffect(() => {
    const filters = {
      search: debouncedSearchTerm || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      page: 1,
      limit: 20
    };

    setFilters(filters);
    fetchMachines(filters);
  }, [debouncedSearchTerm, statusFilter, typeFilter, fetchMachines, setFilters]);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      setStats(prev => ({ ...prev, isLoading: true }));

      try {
        const [total, active, maintenance, inactive, connected] = await Promise.all([
          getTotalMachines(),
          getTotalActiveMachines(),
          getTotalMaintenanceMachines(),
          getTotalInactiveMachines(),
          getTotalConnectedMachines()
        ]);

        setStats({
          total,
          active,
          maintenance,
          inactive,
          connected,
          isLoading: false
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, [getTotalMachines, getTotalActiveMachines, getTotalMaintenanceMachines, getTotalInactiveMachines, getTotalConnectedMachines]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
    clearDeleteError();
  }, [clearError, clearDeleteError]);

  // Memoized filtered machines (for local search optimization)
  const filteredMachines = useMemo(() => {
    return machines.filter(machine => {
      const matchesSearch = !searchTerm ||
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || machine.status === statusFilter;
      const matchesType = !typeFilter || machine.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [machines, searchTerm, statusFilter, typeFilter]);

  const handleRefresh = useCallback(async () => {
    await refreshMachines();
  }, [refreshMachines]);

  const handleDeleteClick = (machine: any) => {
    setDeleteDialog({
      isOpen: true,
      machineId: machine.id,
      machineName: machine.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.machineId) return;

    try {
      const success = await deleteMachine(deleteDialog.machineId);

      if (success) {
        notify.success('Máquina eliminada exitosamente');
        setDeleteDialog({ isOpen: false, machineId: null, machineName: '' });
      } else {
        notify.error(deleteError || 'Error al eliminar máquina');
      }
    } catch (error) {
      notify.error('Error inesperado al eliminar máquina');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, machineId: null, machineName: '' });
    clearDeleteError();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDebouncedSearchTerm('');
  };

  // Loading skeleton
  if (isLoading && machines.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
                  <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Table Skeleton */}
              <div className="card">
                <div className="p-6 animate-pulse">
                  <div className="w-64 h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="w-full h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error && machines.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
                  <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <div className="card p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquinas</h3>
              <p className="text-muted mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary">
                Reintentar
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Actualizar'
                  )}
                </button>
                <Link href="/maquinas/nueva" className="btn-primary flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nueva Máquina</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    {stats.isLoading ? (
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-2xl font-bold text-dark">{stats.total}</div>
                    )}
                    <div className="text-sm text-muted">Total</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Monitor className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    {stats.isLoading ? (
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-2xl font-bold text-dark">{stats.active}</div>
                    )}
                    <div className="text-sm text-muted">Activas</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Monitor className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    {stats.isLoading ? (
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-2xl font-bold text-dark">{stats.maintenance}</div>
                    )}
                    <div className="text-sm text-muted">Mantenimiento</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Monitor className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    {stats.isLoading ? (
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-2xl font-bold text-dark">{stats.inactive}</div>
                    )}
                    <div className="text-sm text-muted">Inactivas</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Wifi className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    {stats.isLoading ? (
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-2xl font-bold text-dark">{stats.connected}</div>
                    )}
                    <div className="text-sm text-muted">Conectadas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o ubicación..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    className="input-field min-w-[140px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="Active">Activa</option>
                    <option value="Inactive">Inactiva</option>
                    <option value="Maintenance">Mantenimiento</option>
                  </select>
                  <select
                    className="input-field min-w-[120px]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="MDB-DEX">MDB-DEX</option>
                    <option value="Coinco">Coinco</option>
                    <option value="Mars">Mars</option>
                  </select>
                  {(searchTerm || statusFilter || typeFilter) && (
                    <button
                      onClick={clearFilters}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Machines Table */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-dark">
                  Máquinas ({filteredMachines.length})
                </h3>
              </div>

              {filteredMachines.length === 0 ? (
                <div className="p-8 text-center">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark mb-2">No hay máquinas</h3>
                  <p className="text-muted mb-4">
                    {searchTerm || statusFilter || typeFilter
                      ? 'No se encontraron máquinas que coincidan con los filtros aplicados.'
                      : 'Aún no hay máquinas registradas en el sistema.'}
                  </p>
                  {!(searchTerm || statusFilter || typeFilter) && (
                    <Link href="/maquinas/nueva" className="btn-primary">
                      Crear primera máquina
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Habilitada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actualizada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMachines.map((machine) => (
                        <tr key={machine.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                            {machine.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                                <Monitor className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-sm font-medium text-dark">{machine.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${MachineAdapter.getStatusColor(machine.status)}`}>
                              {MachineAdapter.getStatusText(machine.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {machine.is_enabled ? (
                              <span className="text-green-600">Sí</span>
                            ) : (
                              <span className="text-red-600">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-dark whitespace-pre-line">{machine.location}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(machine.created_at).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(machine.updated_at).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {machine.type || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/maquinas/${machine.id}`}
                                className="text-primary hover:text-primary-dark p-1 rounded hover:bg-gray-100"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/maquinas/${machine.id}/editar`}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-gray-100"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(machine)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-100"
                                title="Eliminar"
                                disabled={isDeleting}
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

            {/* Pagination */}
            <UserStorePagination />
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Eliminar Máquina"
        message={`¿Estás seguro de que deseas eliminar la máquina "${deleteDialog.machineName}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}