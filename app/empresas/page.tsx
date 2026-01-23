'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Eye, Edit, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { useUser } from '@/lib/stores/authStore';
import type { Enterprise, EnterprisesFilters } from '@/lib/interfaces/enterprise.interface';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ApiErrorDisplay } from '@/components/ErrorDisplay';

export default function EmpresasPage() {
  const router = useRouter();
  const authUser = useUser();
  const canManageEnterprises = authUser?.role === 'admin';
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [enterpriseToDelete, setEnterpriseToDelete] = useState<Enterprise | null>(null);

  // Store state
  const {
    enterprises,
    isLoading,
    error,
    pagination,
    fetchEnterprises,
    deleteEnterprise,
    isDeleting,
    deleteError,
    clearErrors,
  } = useEnterpriseStore();

  // Cargar empresas al montar el componente
  useEffect(() => {
    fetchEnterprises({ page: 1, limit: 10 });
  }, [fetchEnterprises]);

  // Función para realizar búsqueda
  const performSearch = useCallback(async (search?: string, page?: number) => {
    try {
      const filters: EnterprisesFilters = {
        page: page || 1,
        limit: 10,
      };
      
      if (search && search.trim()) {
        filters.search = search.trim();
      }
      
      await fetchEnterprises(filters);
    } catch (error) {
      console.error('Error al realizar búsqueda de empresas:', error);
      // El error ya se maneja en el store, no necesitamos hacer nada más aquí
    }
  }, [fetchEnterprises]);

  // Manejar cambios en búsqueda con debounce
  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch(searchTerm, 1);
        setCurrentPage(1);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Si no hay búsqueda, cargar todas las empresas
      performSearch('', 1);
      setCurrentPage(1);
    }
  }, [searchTerm, performSearch]);

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(searchTerm, page);
  };

  // Manejar eliminación
  const handleDeleteClick = (enterprise: Enterprise) => {
    if (!canManageEnterprises) return;
    setEnterpriseToDelete(enterprise);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!enterpriseToDelete || !canManageEnterprises) return;

    try {
      const success = await deleteEnterprise(enterpriseToDelete.id);
      
      if (success) {
        setShowDeleteModal(false);
        setEnterpriseToDelete(null);
        // Recargar la página actual
        performSearch(searchTerm, currentPage);
      }
      // Si no es exitoso, el error ya se maneja en el store
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      // El error ya se maneja en el store, el modal permanece abierto para mostrar el error
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEnterpriseToDelete(null);
    clearErrors();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/15 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Empresas</h1>
                  <p className="text-white/80">Gestiona las empresas del sistema</p>
                </div>
              </div>
              {canManageEnterprises && (
                <button
                  onClick={() => router.push('/empresas/crear')}
                  className="px-4 py-2 bg-white text-[#3157b2] rounded-lg font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Empresa</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="w-full mx-auto">
            
            {/* Filtros */}
            <div className="card p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar empresas por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted hidden md:inline-block">
                    {enterprises.length} resultados
                  </span>
                  <button
                    onClick={() => performSearch('', 1)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <ApiErrorDisplay
              error={error}
              onRetry={() => performSearch(searchTerm, currentPage)}
              onDismiss={clearErrors}
              className="mb-6"
            />

            {/* Delete Error */}
            <ApiErrorDisplay
              error={deleteError}
              onDismiss={clearErrors}
              className="mb-6"
            />

            {/* Loading State */}
            {isLoading ? (
              <div className="card p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Cargando empresas...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Stats cards removed */}

                {/* Enterprises Table */}
                <div className="card overflow-hidden">
                  {enterprises.length === 0 ? (
                    <div className="p-8 text-center">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-dark mb-2">No hay empresas</h3>
                      <p className="text-muted mb-4">
                        {searchTerm ? 'No se encontraron empresas que coincidan con tu búsqueda.' : 'Aún no hay empresas registradas.'}
                      </p>
                      <button
                        onClick={() => router.push('/empresas/crear')}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Crear Primera Empresa
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-dark">
                          Empresas ({enterprises.length})
                        </h3>
                        <span className="text-sm text-muted">
                          Última actualización: {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Empresa
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                RUT
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contacto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dirección
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {enterprises.map((enterprise, index) => (
                              <tr
                                key={enterprise.id}
                                className={`transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                                } hover:bg-gray-50`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                                      <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-semibold text-dark">
                                        {enterprise.name}
                                      </div>
                                      <div className="text-xs uppercase tracking-wide text-muted">
                                        ID: {enterprise.id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-dark">{enterprise.rut}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-dark">
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    {enterprise.phone}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-start text-sm text-dark">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{enterprise.address}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => router.push(`/empresas/${enterprise.id}`)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                      title="Ver detalles"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => router.push(`/empresas/${enterprise.id}/editar`)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                      title="Editar"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    {canManageEnterprises && (
                                      <button
                                        onClick={() => handleDeleteClick(enterprise)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                        title="Eliminar"
                                        disabled={isDeleting}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {pagination?.meta && pagination.meta.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted">
                              Mostrando {pagination.meta.from} a {pagination.meta.to} de {pagination.meta.total} empresas
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Anterior
                              </button>
                              
                              {Array.from({ length: pagination.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`px-3 py-1 text-sm border rounded-md ${
                                    page === currentPage
                                      ? 'bg-primary text-white border-primary'
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.meta.last_page}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {canManageEnterprises && showDeleteModal && enterpriseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-black mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la empresa <strong>{enterpriseToDelete.name}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
