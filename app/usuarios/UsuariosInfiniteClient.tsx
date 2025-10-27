'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useUserStore } from '@/lib/stores/userStore';
import UserStorePagination from '@/components/UserStorePagination';
import UserPageSkeleton from '@/components/skeletons/UserPageSkeleton';
import { notify } from '@/lib/adapters/notification.adapter';

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
    getTotalUsers,
    getTotalActiveUsers,
    getTotalAdminUsers,
    getTotalInactiveUsers,
  } = useUserStore();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: ''
  });
  
  // Global stats state
  const [globalStats, setGlobalStats] = useState({
    totalActive: 0,
    totalAdmins: 0,
    totalInactive: 0,
    isLoading: false,
  });
  
  const filtersRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  
  const loadGlobalStats = useCallback(async () => {
    setGlobalStats(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [totalActive, totalAdmins, totalInactive] = await Promise.all([
        getTotalActiveUsers(),
        getTotalAdminUsers(),
        getTotalInactiveUsers(),
      ]);
      
      setGlobalStats({
        totalActive,
        totalAdmins,
        totalInactive,
        isLoading: false,
      });
    } catch (error) {
      setGlobalStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [getTotalActiveUsers, getTotalAdminUsers, getTotalInactiveUsers]);

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
  
  const hasLoadedStats = useRef(false);
  useEffect(() => {
    if (!hasLoadedStats.current) {
      hasLoadedStats.current = true;
      loadGlobalStats();
    }
  }, [loadGlobalStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const apiFilters = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page: 1,
  }), [debouncedSearchTerm, roleFilter, statusFilter]);

  const prevFiltersRef = useRef(apiFilters);
  const applyFilters = useCallback((filters: typeof apiFilters) => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged) {
      setFilters(filters);
      fetchUsers(filters);
      prevFiltersRef.current = filters;
    }
  }, [setFilters, fetchUsers]);
  
  const apiFiltersString = JSON.stringify(apiFilters);
  
  useEffect(() => {
    if (users.length > 0) {
      applyFilters(apiFilters);
    }
  }, [apiFiltersString, applyFilters, users.length]);

  const displayedUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    
    if (searchTerm !== debouncedSearchTerm) {
      return users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rut.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return users;
  }, [users, searchTerm, debouncedSearchTerm]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'operator': return 'Operador';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
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
        // Reload global stats after successful deletion
        loadGlobalStats();
      } else {
        notify.error(`Error al eliminar el usuario "${deleteDialog.userName}"`);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, userId: null, userName: '' });
    clearDeleteError();
  };

  const stats = {
    total: getTotalUsers(),
    active: globalStats.totalActive,
    admins: globalStats.totalAdmins,
    inactive: globalStats.totalInactive,
    displayed: displayedUsers.length,
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
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-muted">Total Usuarios</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">SERVIDOR</span>
                    </div>
                    <p className="text-2xl font-bold text-dark">{stats.total}</p>
                    {stats.displayed !== stats.total && (
                      <p className="text-xs text-muted mt-1">{stats.displayed} mostrados de {stats.total} total</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-muted">Usuarios Activos</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">SERVIDOR</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {globalStats.isLoading ? '...' : stats.active}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 flex-shrink-0 ml-4">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-muted">Administradores</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">SERVIDOR</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {globalStats.isLoading ? '...' : stats.admins}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-muted">Inactivos</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">SERVIDOR</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {globalStats.isLoading ? '...' : stats.inactive}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* Search and Filters - Sticky */}
          <div className="sticky top-20 z-50 bg-gray-50 py-4">
            <div className="px-6">
              <div className="card p-6 shadow-lg border-2 border-primary/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-dark">🔍 Buscar Usuarios</h3>
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
                      placeholder="Buscar usuarios por nombre, email o RUT..."
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
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="operator">Operador</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                  <select 
                    className="input-field flex-1"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              
              {/* Filtros activos */}
              {(searchTerm || roleFilter || statusFilter) && (
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
                  {roleFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Rol: {getRoleName(roleFilter)}
                      <button 
                        onClick={() => setRoleFilter('')}
                        className="ml-2 hover:text-purple-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Estado: {statusFilter === 'active' ? 'Activo' : 'Inactivo'}
                      <button 
                        onClick={() => setStatusFilter('')}
                        className="ml-2 hover:text-green-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      setStatusFilter('');
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Permisos
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {getRoleName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(user.lastLogin).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.permissions.slice(0, 2).map((permission) => (
                                <span key={permission} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {permission}
                                </span>
                              ))}
                              {user.permissions.length > 2 && (
                                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  +{user.permissions.length - 2}
                                </span>
                              )}
                            </div>
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

          {/* Pagination Controls */}
          <UserStorePagination className="px-6 py-4" />

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
