'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Eye, Edit, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ApiErrorDisplay, EmptyStateDisplay } from '@/components/ErrorDisplay';

export default function EmpresasPage() {
  const router = useRouter();
  
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
      const filters: any = {
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
    setEnterpriseToDelete(enterprise);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!enterpriseToDelete) return;

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
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Empresas</h1>
                  <p className="text-gray-600">Gestiona las empresas del sistema</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/empresas/crear')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Empresa</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar empresas por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Cargando empresas...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Stats cards removed */}

                {/* Enterprises Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {enterprises.length === 0 ? (
                    <div className="p-8 text-center">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empresas</h3>
                      <p className="text-gray-600 mb-4">
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
                            {enterprises.map((enterprise) => (
                              <tr key={enterprise.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                                      <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-black">{enterprise.name}</div>
                                      <div className="text-sm text-gray-500">ID: {enterprise.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-black">{enterprise.rut}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-black">
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    {enterprise.phone}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-start text-sm text-black">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{enterprise.address}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => router.push(`/empresas/${enterprise.id}`)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Ver detalles"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => router.push(`/empresas/${enterprise.id}/editar`)}
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(enterprise)}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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

                      {/* Pagination */}
                      {pagination && pagination.meta.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Mostrando {pagination.meta.from} a {pagination.meta.to} de {pagination.meta.total} empresas
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.meta.last_page}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {showDeleteModal && enterpriseToDelete && (
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
