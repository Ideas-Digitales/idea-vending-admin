'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Edit, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import UsersFiltersComponent from '@/components/UsersFilters';
import MachineStylePagination from '@/components/MachineStylePagination';
import { useUserStore } from '@/lib/stores/userStore';
import UserPageSkeleton from '@/components/skeletons/UserPageSkeleton';
import { notify } from '@/lib/adapters/notification.adapter';
import { UsersFilters } from '@/lib/interfaces/user.interface';

export default function UsuariosInfiniteClient() {
  const router = useRouter();
  
  // Store state
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    refreshUsers,
    setFilters,
    clearError,
    deleteUser,
    isDeleting,
    deleteError,
    clearDeleteError,
    pagination,
    currentFilters,
    hasNextPage,
    hasPrevPage,
  } = useUserStore();

  // Local UI state - Complete filters
  const [filters, setFiltersState] = useState<UsersFilters>({
    page: 1,
    limit: 20,
    searchObj: {
      value: '',
      case_sensitive: false
    },
    filters: []
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: ''
  });
  

  useEffect(() => {
    // Solo cargar usuarios si no hay datos y no estamos cargando
    if (users.length === 0 && !isLoading && !error) {
      fetchUsers();
    }
  }, [users.length, isLoading, error, fetchUsers]);

  // Mostrar toast para errores
  useEffect(() => {
    if (error) {
      notify.error(`Error al cargar usuarios: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (deleteError) {
      notify.error(`Error al eliminar usuario: ${deleteError}`);
    }
  }, [deleteError]);
  

  // Debounce filters to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 Applying filters:', filters);
      fetchUsers(filters);
      setFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, fetchUsers, setFilters]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: UsersFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    try {
      const newFilters = {
        ...currentFilters,
        page,
      };

      setFilters(newFilters);
      await fetchUsers(newFilters);
    } catch (error) {
      console.error('Error al cambiar página de usuarios:', error);
      // El error ya se maneja en el store
    }
  }, [currentFilters, setFilters, fetchUsers]);

  // Handle page size change
  const handlePageSizeChange = useCallback(async (limit: number) => {
    try {
      const newFilters = {
        ...currentFilters,
        page: 1, // Reset to first page when changing page size
        limit,
      };

      setFilters(newFilters);
      await fetchUsers(newFilters);
    } catch (error) {
      console.error('Error al cambiar tamaño de página de usuarios:', error);
      // El error ya se maneja en el store
    }
  }, [currentFilters, setFilters, fetchUsers]);


  // Users are already filtered by the API, no need for client-side filtering
  const displayedUsers = users;

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const handleViewUser = (userId: number) => {
    router.push(`/usuarios/${userId}`);
  };

  // Delete handlers
  const handleDeleteClick = (userId: number, userName: string) => {
    setDeleteDialog({
      isOpen: true,
      userId,
      userName
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.userId) {
      const success = await deleteUser(deleteDialog.userId);
      if (success) {
        notify.success(`Usuario "${deleteDialog.userName}" eliminado exitosamente`);
        setDeleteDialog({ isOpen: false, userId: null, userName: '' });
      } else {
        notify.error(`Error al eliminar el usuario "${deleteDialog.userName}"`);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, userId: null, userName: '' });
    clearDeleteError();
  };


  const handleRefresh = () => {
    refreshUsers();
  };

  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Marcar como inicializado cuando tengamos datos o cuando termine la carga inicial
  useEffect(() => {
    if (users.length > 0 || (!isLoading && isInitialized)) {
      setIsInitialized(true);
      setShowSkeleton(false);
    }
  }, [users.length, isLoading, isInitialized]);

  useEffect(() => {
    // Solo mostrar skeleton en la carga inicial si no hay datos persistidos
    if (isLoading && users.length === 0 && !error && !isInitialized) {
      setShowSkeleton(true);
      const timeout = setTimeout(() => {
        setShowSkeleton(false);
        setIsInitialized(true);
      }, 3000); // Reducido a 3 segundos
      
      return () => clearTimeout(timeout);
    } else if (users.length > 0 || error) {
      setShowSkeleton(false);
      setIsInitialized(true);
    }
  }, [isLoading, users.length, error, isInitialized]);
  
  if (showSkeleton) {
    return <UserPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Usuarios</h1>
                  <p className="text-muted">Administra usuarios, roles y permisos del sistema</p>
                </div>
              </div>
              <Link 
                href="/usuarios/crear"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Usuario</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative">

          {error && (
            <div className="px-6 py-4">
              <div className="card p-6 bg-red-50 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error al cargar usuarios</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button 
                    onClick={clearError}
                    className="ml-auto btn-secondary text-sm mr-2"
                  >
                    Limpiar
                  </button>
                  <button 
                    onClick={handleRefresh}
                    className="btn-secondary text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="px-6">
            <UsersFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="px-6 py-4">
              <div className="card p-6 bg-red-50 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error al cargar usuarios</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button 
                    onClick={clearError}
                    className="ml-auto btn-secondary text-sm mr-2"
                  >
                    Limpiar
                  </button>
                  <button 
                    onClick={handleRefresh}
                    className="btn-secondary text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="px-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">
                    Lista de Usuarios 
                    {displayedUsers.length !== users.length && (
                      <span className="text-sm font-normal text-muted ml-2">
                        ({displayedUsers.length} de {users.length} mostrados)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full mr-2">API</span>
                      <span className="text-muted">Todos los datos provienen del servidor</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {displayedUsers.length === 0 && !isLoading ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark mb-2">No se encontraron usuarios</h3>
                  <p className="text-muted">
                    {users.length === 0 
                      ? 'No hay usuarios registrados en el sistema.'
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
                            Usuario
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            RUT
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Rol
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
                            Último Acceso
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                                <span className="text-white text-sm font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-dark">{user.name}</div>
                                <div className="text-sm text-muted">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark">{user.rut}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                    {role.name}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Sin roles
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(user.lastLogin).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => handleViewUser(user.id)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => window.location.href = `/usuarios/${user.id}/editar`}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                title="Eliminar usuario"
                                onClick={() => handleDeleteClick(user.id, user.name)}
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
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="px-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted">Cargando usuarios...</span>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && (
            <div className="px-6 mt-6">
              <MachineStylePagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isLoading}
                itemName="usuarios"
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
              />
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario "${deleteDialog.userName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Error Display */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <span>{deleteError}</span>
            <button 
              onClick={clearDeleteError}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
