'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { type Usuario, type UsersResponse } from '@/lib/actions/users';
import { useInfiniteScroll, useScrollToBottom } from '@/lib/hooks/useInfiniteScroll';

interface UsuariosInfiniteClientProps {
  initialUsers: Usuario[];
  initialPagination?: UsersResponse['pagination'];
}

export default function UsuariosInfiniteClient({ 
  initialUsers, 
  initialPagination 
}: UsuariosInfiniteClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  }), [debouncedSearchTerm, roleFilter, statusFilter]);

  // Hook de scroll infinito (sin filtros automáticos)
  const {
    users,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll({
    initialUsers,
    initialPagination,
    filters: {}, // Sin filtros automáticos
  });

  // Refrescar solo cuando los filtros de servidor cambien
  const prevFiltersRef = useRef(apiFilters);
  useEffect(() => {
    // Solo refrescar si los filtros realmente cambiaron
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(apiFilters);
    if (filtersChanged && (debouncedSearchTerm || roleFilter || statusFilter)) {
      refresh(apiFilters);
      prevFiltersRef.current = apiFilters;
    }
  }, [debouncedSearchTerm, roleFilter, statusFilter, apiFilters, refresh]);

  // Hook para detectar scroll al final
  useScrollToBottom(useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]));

  // Efecto para manejar el sticky manual
  useEffect(() => {
    const handleScroll = () => {
      if (!filtersRef.current || !mainRef.current) return;
      
      const mainRect = mainRef.current.getBoundingClientRect();
      const filtersRect = filtersRef.current.getBoundingClientRect();
      
      // Si el top del main está por encima del viewport, activar sticky
      const shouldBeSticky = mainRect.top < 0;
      setIsSticky(shouldBeSticky);
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Filtrado local (solo para búsqueda instantánea)
  const displayedUsers = useMemo(() => {
    // Si no hay término de búsqueda, mostrar todos los usuarios
    if (!searchTerm) {
      return users;
    }
    
    // Si el término de búsqueda es diferente al debounced, hacer filtrado local instantáneo
    if (searchTerm !== debouncedSearchTerm) {
      return users.filter(usuario => 
        usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.rut.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Si el término coincide con el debounced, mostrar los usuarios del servidor
    return users;
  }, [users, searchTerm, debouncedSearchTerm]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'operator': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
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

  // Calcular estadísticas
  const stats = {
    total: displayedUsers.length,
    active: displayedUsers.filter(u => u.status === 'active').length,
    admins: displayedUsers.filter(u => u.role === 'admin').length,
    inactive: displayedUsers.filter(u => u.status === 'inactive').length,
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
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Usuarios</h1>
                  <p className="text-muted">Administra usuarios, roles y permisos del sistema</p>
                </div>
              </div>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nuevo Usuario</span>
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
                    <p className="text-sm font-semibold text-muted mb-2">Total Usuarios</p>
                    <p className="text-2xl font-bold text-dark">{stats.total}</p>
                    {totalCount > 0 && stats.total !== totalCount && (
                      <p className="text-xs text-muted mt-1">de {totalCount} total</p>
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
                    <p className="text-sm font-semibold text-muted mb-2">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 flex-shrink-0 ml-4">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted mb-1">Administradores</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted mb-1">Inactivos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <UserX className="h-6 w-6 text-red-600" />
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
                    onClick={() => refresh(apiFilters)}
                    className="ml-auto btn-secondary text-sm"
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
                      <span className="text-muted">Datos reales</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full mr-2">MOCK</span>
                      <span className="text-muted">Pendiente en API</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {displayedUsers.length === 0 && !loading ? (
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
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Estado
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Último Acceso
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Permisos
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedUsers.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                                <span className="text-white text-sm font-medium">
                                  {usuario.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-dark">{usuario.name}</div>
                                <div className="text-sm text-muted">{usuario.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark">{usuario.rut}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(usuario.role)}`}>
                              {getRoleName(usuario.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(usuario.status)}`}>
                              {usuario.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {new Date(usuario.lastLogin).toLocaleString('es-ES')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {usuario.permissions.slice(0, 2).map((permission) => (
                                <span key={permission} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {permission}
                                </span>
                              ))}
                              {usuario.permissions.length > 2 && (
                                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  +{usuario.permissions.length - 2}
                                </span>
                              )}
                            </div>
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
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar usuario"
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
                <span className="text-muted">Cargando más usuarios...</span>
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && users.length > 0 && (
            <div className="px-6">
              <div className="text-center py-8">
                <p className="text-muted">Has visto todos los usuarios disponibles</p>
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
