'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import { PaginationLinks, PaginationMeta, User } from '@/lib/interfaces';
import { useUserStore } from '@/lib/stores/userStore';
import { useUser } from '@/lib/stores/authStore';

interface UsuariosClientProps {
  usuarios: User[];
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export default function UsuariosClient({ usuarios, pagination }: UsuariosClientProps) {
  const authUser = useUser();
  const canManageUsers = authUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: ''
  });

  // Store integration
  const { 
    users: storeUsers, 
    deleteUser, 
    isDeleting, 
    deleteError, 
    clearDeleteError,
    initializeUsers 
  } = useUserStore();

  // Initialize store with server data
  useEffect(() => {
    initializeUsers(usuarios, pagination);
  }, [usuarios, pagination, initializeUsers]);

  // Use store users if available, fallback to prop users
  const currentUsers = storeUsers.length > 0 ? storeUsers : usuarios;

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    // Aquí necesitaremos recargar la página con el nuevo número de página
    // Por ahora, actualizamos la URL para que el server component recargue
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
  };

  // Delete handlers
  const handleDeleteClick = (userId: number, userName: string) => {
    if (!canManageUsers) return;
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
        setDeleteDialog({ isOpen: false, userId: null, userName: '' });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, userId: null, userName: '' });
    clearDeleteError();
  };

  // Filtrar usuarios según los criterios de búsqueda
  const filteredUsuarios = useMemo(() => {
    return currentUsers.filter(usuario => {
      const matchesSearch = searchTerm === '' || 
        usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.rut.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === '' || usuario.role === roleFilter;
      const matchesStatus = statusFilter === '' || usuario.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [currentUsers, searchTerm, roleFilter, statusFilter]);

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

  // Calcular estadísticas basadas en usuarios filtrados
  const stats = {
    total: filteredUsuarios.length,
    active: filteredUsuarios.filter(u => u.status === 'active').length,
    admins: filteredUsuarios.filter(u => u.role === 'admin').length,
    inactive: filteredUsuarios.filter(u => u.status === 'inactive').length,
  };

  // Obtener total real de la paginación si está disponible
  const totalUsuarios = pagination?.meta.total || currentUsers.length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
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
              {canManageUsers && (
                <Link 
                  href="/usuarios/crear"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Usuario</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted mb-2">Total Usuarios</p>
                  <p className="text-2xl font-bold text-dark">{stats.total}</p>
                  {searchTerm || roleFilter || statusFilter ? (
                    <p className="text-xs text-muted mt-1">de {totalUsuarios} total</p>
                  ) : null}
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

          {/* Search and Filters */}
          <div className="mb-6 card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios por nombre, email o RUT..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="operator">Operador</option>
                <option value="viewer">Visualizador</option>
              </select>
              <select 
                className="input-field"
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
                    Búsqueda: &quot;{searchTerm}&quot;
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

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark">
                Lista de Usuarios 
                {filteredUsuarios.length !== currentUsers.length && (
                  <span className="text-sm font-normal text-muted ml-2">
                    ({filteredUsuarios.length} de {currentUsers.length})
                  </span>
                )}
              </h3>
            </div>
            
            {filteredUsuarios.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark mb-2">No se encontraron usuarios</h3>
                <p className="text-muted">
                  {currentUsers.length === 0 
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
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RUT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Acceso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permisos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsuarios.map((usuario) => (
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
                            {canManageUsers && (
                              <button 
                                className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                title="Eliminar usuario"
                                onClick={() => handleDeleteClick(usuario.id, usuario.name)}
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
            )}
            
            {/* Paginación */}
            {pagination && pagination.meta && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination 
                  meta={pagination.meta}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      {canManageUsers && (
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
      )}

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
