'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Building2, Plus, Search, MapPin, Users, Monitor, DollarSign, Eye, Edit, Trash2, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import Pagination from '@/components/Pagination';

function EmpresasContent() {
  const user = useUser();
  const router = useRouter();
  
  // Estado local para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Store state
  const {
    enterprises,
    isLoading,
    error,
    pagination,
    fetchEnterprises,
    getTotalEnterprises,
    getFilteredEnterprisesCount
  } = useEnterpriseStore();

  // Función para realizar búsqueda
  const performSearch = useCallback(async (search?: string, page?: number) => {
    setIsSearching(true);
    try {
      const filters: any = {
        page: page || 1,
      };
      
      // Solo agregar búsqueda si hay término
      if (search && search.trim()) {
        filters.search = search.trim();
        // Incluir relaciones cuando hay búsqueda
        filters.include = ['owner', 'machines'] as ('owner' | 'users' | 'machines')[];
      }
      
      await fetchEnterprises(filters);
    } finally {
      setIsSearching(false);
    }
  }, [fetchEnterprises]);

  // Función para manejar cambios en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Efecto para realizar búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPlanFilter('');
    performSearch('');
  };

  useEffect(() => {
    // Cargar empresas al montar el componente sin filtros
    fetchEnterprises();
  }, [fetchEnterprises]);

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    if (searchTerm) {
      performSearch(searchTerm, page);
    } else {
      fetchEnterprises({ page });
    }
  };

  // Filtrar empresas del lado cliente
  const filteredEnterprises = useMemo(() => {
    let filtered = enterprises;
    
    // Filtrar por estado (simulado - ya que no existe en la API)
    if (statusFilter) {
      // Como no tenemos campo status real, vamos a simular basándose en el ID
      // IDs pares = "active", IDs impares = "inactive"
      filtered = filtered.filter(enterprise => {
        const id = typeof enterprise.id === 'string' ? parseInt(enterprise.id) : enterprise.id;
        const isActive = id % 2 === 0;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }
    
    // Filtrar por plan (simulado - basándose en el nombre)
    if (planFilter) {
      filtered = filtered.filter(enterprise => {
        const name = enterprise.name.toLowerCase();
        switch (planFilter) {
          case 'enterprise':
            return name.includes('llc') || name.includes('inc') || name.includes('spa');
          case 'professional':
            return name.includes('group') || name.includes('associates');
          case 'basic':
            return !name.includes('llc') && !name.includes('inc') && !name.includes('spa') && !name.includes('group') && !name.includes('associates');
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [enterprises, statusFilter, planFilter]);

  // Estadísticas calculadas desde el store
  const totalEmpresas = pagination?.meta?.total || getTotalEnterprises();
  const empresasActivas = filteredEnterprises.length; // Empresas filtradas
  
  // Estadísticas calculadas desde las relaciones
  const totalMaquinas = filteredEnterprises.reduce((total: number, empresa: Enterprise) => {
    return total + (empresa.machines?.length || 0);
  }, 0);
  
  // Para ingresos totales aún no tenemos datos de la API
  const ingresosTotales = 0; // TODO: Agregar datos de ingresos a la API

  // Navigation functions
  const handleViewEnterprise = (enterpriseId: number) => {
    router.push(`/empresas/${enterpriseId}`);
  };

  const handleEditEnterprise = (enterpriseId: number) => {
    router.push(`/empresas/${enterpriseId}/editar`);
  };

  const handleDeleteEnterprise = (enterpriseId: number) => {
    // TODO: Implement delete functionality
    console.log('Delete enterprise:', enterpriseId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Empresas</h1>
                  <p className="text-muted">Administra empresas clientes y sus suscripciones</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/empresas/crear')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Empresa</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Total Empresas</p>
                  <p className="text-2xl font-bold text-dark">{totalEmpresas}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">En Página Actual</p>
                  <p className="text-2xl font-bold text-green-600">{empresasActivas}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Estado</p>
                  <p className="text-2xl font-bold text-purple-600">{isLoading ? 'Cargando...' : 'Listo'}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Fuente de Datos</p>
                  <p className="text-2xl font-bold text-green-600">API</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 card p-6">
            <div className="space-y-4">
              {/* Search Input - Full Width */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresas por nombre o RUT..."
                  className="input-field w-full pl-10 pr-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={isLoading || isSearching}
                />
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                ) : searchTerm ? (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              
              {/* Filter Selects - Second Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <select 
                  className="input-field flex-1"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={isLoading || isSearching}
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <select 
                  className="input-field flex-1"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  disabled={isLoading || isSearching}
                >
                  <option value="">Todos los planes</option>
                  <option value="enterprise">Empresarial</option>
                  <option value="professional">Profesional</option>
                  <option value="basic">Básico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {(searchTerm || statusFilter || planFilter) && !isLoading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Search className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    {isSearching ? (
                      'Buscando...'
                    ) : (
                      <>
                        Filtros activos: 
                        {searchTerm && <span className="ml-1"><strong>"{searchTerm}"</strong></span>}
                        {statusFilter && <span className="ml-1 px-2 py-1 bg-blue-100 rounded text-xs">Estado: {statusFilter}</span>}
                        {planFilter && <span className="ml-1 px-2 py-1 bg-blue-100 rounded text-xs">Plan: {planFilter}</span>}
                        <span className="ml-2">→ {filteredEnterprises.length} empresa{filteredEnterprises.length !== 1 ? 's' : ''} encontrada{filteredEnterprises.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  disabled={isSearching}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted">Cargando empresas...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <Building2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar empresas</h3>
                <p className="text-muted mb-4">{error}</p>
                <button onClick={() => fetchEnterprises()} className="btn-primary">
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Companies Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {filteredEnterprises.map((empresa) => (
                <div key={empresa.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-dark">{empresa.name}</h3>
                        <p className="text-sm text-muted">{empresa.rut}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activa
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ID: {empresa.id}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{empresa.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted">
                      <span>📱 {empresa.phone}</span>
                    </div>
                    {empresa.owner && (
                      <div className="flex items-center text-sm text-muted">
                        <User className="h-4 w-4 mr-2" />
                        <span>Propietario: {empresa.owner.name}</span>
                      </div>
                    )}
                    {empresa.machines && empresa.machines.length > 0 && (
                      <div className="flex items-center text-sm text-muted">
                        <Monitor className="h-4 w-4 mr-2" />
                        <span>{empresa.machines.length} máquina{empresa.machines.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-muted">
                      ID: {empresa.id}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewEnterprise(Number(empresa.id))}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => router.push(`/empresas/${empresa.id}/editar`)}
                        className="text-gray-600 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Editar empresa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEnterprise(Number(empresa.id))}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar empresa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredEnterprises.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <Building2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-dark mb-2">No hay empresas</h3>
                <p className="text-muted mb-4">No se encontraron empresas en el sistema.</p>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera empresa
                </button>
              </div>
            </div>
          )}

          {/* Paginación */}
          {!isLoading && !error && enterprises.length > 0 && pagination?.meta && (
            <div className="mt-8">
              <Pagination
                meta={pagination.meta}
                onPageChange={handlePageChange}
                className="bg-white p-4 rounded-lg border border-gray-200"
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function EmpresasPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_enterprises']}>
      <EmpresasContent />
    </ProtectedRoute>
  );
}
