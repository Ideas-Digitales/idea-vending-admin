'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { PageLayout, DataTable, FilterBar, StatusBadge, UnifiedPagination, ConfirmActionDialog } from '@/components/ui-custom';
import type { ColumnDef } from '@/components/ui-custom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserStore } from '@/lib/stores/userStore';
import { useUser } from '@/lib/stores/authStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { UsersFilters } from '@/lib/interfaces/user.interface';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';
import type { UserRole } from '@/lib/constants/roles';
import type { User } from '@/lib/interfaces';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'customer', label: 'Cliente' },
  { value: 'technician', label: 'Técnico' },
];

function roleToStatusVariant(role: string): 'success' | 'warning' | 'info' | 'default' {
  if (role === 'admin') return 'warning';
  if (role === 'customer') return 'info';
  if (role === 'technician') return 'success';
  return 'default';
}

function statusToVariant(status: string): 'success' | 'error' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'error';
  return 'default';
}

export default function UsuariosInfiniteClient() {
  const authUser = useUser();
  const canManageUsers = authUser?.role === 'admin';

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

  const [filters, setFiltersState] = useState<UsersFilters>({
    page: 1,
    limit: 20,
    searchObj: { value: '', case_sensitive: false },
    filters: [],
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({ isOpen: false, userId: null, userName: '' });

  useEffect(() => {
    if (users.length === 0 && !isLoading && !error) {
      fetchUsers();
    }
  }, [users.length, isLoading, error, fetchUsers]);

  useEffect(() => {
    if (error) notify.error(`Error al cargar usuarios: ${error}`);
  }, [error]);

  useEffect(() => {
    if (deleteError) notify.error(`Error al eliminar usuario: ${deleteError}`);
  }, [deleteError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(filters);
      setFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, fetchUsers, setFilters]);

  const handleFiltersChange = useCallback((newFilters: UsersFilters) => {
    setFiltersState(newFilters);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFiltersState((prev) => ({
      ...prev,
      searchObj: { value, case_sensitive: false },
    }));
  }, []);

  const selectedRole = filters.scopes?.find((s) => s.name === 'whereRole')?.parameters[0] ?? '';

  const handleRoleChange = useCallback((role: string) => {
    setFiltersState((prev) => ({
      ...prev,
      scopes:
        role === selectedRole ? [] : [{ name: 'whereRole', parameters: [role] }],
    }));
  }, [selectedRole]);

  const handlePageChange = useCallback(
    async (page: number) => {
      const newFilters = { ...currentFilters, page };
      setFilters(newFilters);
      await fetchUsers(newFilters);
    },
    [currentFilters, setFilters, fetchUsers]
  );

  const handlePageSizeChange = useCallback(
    async (limit: number) => {
      const newFilters = { ...currentFilters, page: 1, limit };
      setFilters(newFilters);
      await fetchUsers(newFilters);
    },
    [currentFilters, setFilters, fetchUsers]
  );

  const handleDeleteClick = (userId: number, userName: string) => {
    if (!canManageUsers) return;
    setDeleteDialog({ isOpen: true, userId, userName });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.userId) {
      const success = await deleteUser(deleteDialog.userId);
      if (success) {
        notify.success(`Usuario "${deleteDialog.userName}" eliminado exitosamente`);
        setDeleteDialog({ isOpen: false, userId: null, userName: '' });
      }
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      key: 'user',
      header: 'Usuario',
      cell: (user) => (
        <Link href={`/usuarios/${user.id}`} className="flex items-center group">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-dark group-hover:text-primary transition-colors">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
          </div>
        </Link>
      ),
    },
    {
      key: 'rut',
      header: 'RUT',
      cell: (user) => <span className="text-sm text-dark">{user.rut}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (user) => (
        <StatusBadge
          label={ROLE_LABELS[user.role as UserRole] ?? user.role}
          variant={roleToStatusVariant(user.role)}
        />
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (user) => (
        <StatusBadge
          label={user.status === 'active' ? 'Activo' : user.status === 'inactive' ? 'Inactivo' : user.status}
          variant={statusToVariant(user.status)}
        />
      ),
    },
    {
      key: 'lastLogin',
      header: 'Último Acceso',
      cell: (user) => (
        <span className="text-sm text-muted">
          {new Date(user.lastLogin).toLocaleString('es-ES')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="text-right block">Acciones</span>,
      cell: (user) => (
        <div className="flex items-center justify-end space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                onClick={() => window.location.href = `/usuarios/${user.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalles</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-900 hover:bg-green-50"
                onClick={() => window.location.href = `/usuarios/${user.id}/editar`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar usuario</TooltipContent>
          </Tooltip>
          {canManageUsers && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                  disabled={isDeleting}
                  onClick={() => handleDeleteClick(user.id, user.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar usuario</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  const roleFilterSlot = canManageUsers ? (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
      {ROLE_OPTIONS.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => handleRoleChange(opt.value)}
          className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold transition-colors ${
            i > 0 ? 'border-l border-gray-300' : ''
          } ${
            selectedRole === opt.value
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <PageLayout
      icon={Users}
      title="Gestión de Usuarios"
      subtitle="Administra usuarios, roles y permisos del sistema"
      requiredPermissions={['users.read.all']}
      permissionMatch="any"
      actions={
        canManageUsers ? (
          <Link href="/usuarios/crear" className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </Link>
        ) : undefined
      }
    >
      {error && (
        <div className="card p-6 bg-red-50 border border-red-200 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error al cargar usuarios</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={clearError} className="ml-auto btn-secondary text-sm mr-2">Limpiar</button>
            <button onClick={() => refreshUsers()} className="btn-secondary text-sm">Reintentar</button>
          </div>
        </div>
      )}

      <FilterBar
        searchValue={filters.searchObj?.value || ''}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, email o RUT..."
        filters={roleFilterSlot}
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyIcon={Users}
        emptyTitle="No se encontraron usuarios"
        emptyMessage={
          users.length === 0
            ? 'No hay usuarios registrados en el sistema.'
            : 'Intenta ajustar los filtros de búsqueda.'
        }
        title="Lista de Usuarios"
        count={pagination?.meta?.total ?? users.length}
        keyExtractor={(u) => u.id}
      />

      {pagination?.meta && (
        <div className="mt-6">
          <UnifiedPagination
            meta={pagination.meta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            itemName="usuarios"
          />
        </div>
      )}

      <ConfirmActionDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ isOpen: false, userId: null, userName: '' });
            clearDeleteError();
          }
        }}
        title="Eliminar Usuario"
        description={`¿Estás seguro de que deseas eliminar al usuario "${deleteDialog.userName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </PageLayout>
  );
}
