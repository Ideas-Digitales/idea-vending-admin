'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, MapPin, Phone, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditEmpresaModal } from '@/components/modals/EditEmpresaModal';
import { CreateEmpresaModal } from '@/components/modals/CreateEmpresaModal';
import { PageLayout, DataTable, FilterBar, ConfirmActionDialog, UnifiedPagination } from '@/components/ui-custom';
import type { ColumnDef } from '@/components/ui-custom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { useUser } from '@/lib/stores/authStore';
import type { Enterprise, EnterprisesFilters } from '@/lib/interfaces/enterprise.interface';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ApiErrorDisplay } from '@/components/ErrorDisplay';

export default function EmpresasPage() {
  const router = useRouter();
  const authUser = useUser();
  const canManageEnterprises = authUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    enterprise: Enterprise | null;
  }>({ isOpen: false, enterprise: null });
  const [editModal, setEditModal] = useState<{ open: boolean; enterpriseId: number | null }>({
    open: false,
    enterpriseId: null,
  });
  const [createModal, setCreateModal] = useState(false);

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

  useEffect(() => {
    fetchEnterprises({ page: 1, limit: 10 });
  }, [fetchEnterprises]);

  const performSearch = useCallback(
    async (search?: string, page?: number) => {
      try {
        const filters: EnterprisesFilters = { page: page || 1, limit: 10 };
        if (search && search.trim()) filters.search = search.trim();
        await fetchEnterprises(filters);
      } catch (error) {
        console.error('Error al realizar búsqueda de empresas:', error);
      }
    },
    [fetchEnterprises]
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      const id = setTimeout(() => {
        performSearch(searchTerm, 1);
        setCurrentPage(1);
      }, 500);
      return () => clearTimeout(id);
    } else {
      performSearch('', 1);
      setCurrentPage(1);
    }
  }, [searchTerm, performSearch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(searchTerm, page);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.enterprise || !canManageEnterprises) return;
    try {
      const success = await deleteEnterprise(deleteDialog.enterprise.id);
      if (success) {
        setDeleteDialog({ isOpen: false, enterprise: null });
        performSearch(searchTerm, currentPage);
      }
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
    }
  };

  const columns: ColumnDef<Enterprise>[] = [
    {
      key: 'empresa',
      header: 'Empresa',
      cell: (e) => (
        <Link href={`/empresas/${e.id}`} className="flex items-center group">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg ring-4 ring-primary/10 mr-4 flex-shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-dark group-hover:text-primary transition-colors">{e.name}</div>
            <div className="text-xs text-muted sm:hidden">{e.rut}</div>
          </div>
        </Link>
      ),
    },
    {
      key: 'rut',
      header: 'RUT',
      headerClassName: 'hidden sm:table-cell px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'hidden sm:table-cell',
      cell: (e) => <span className="text-sm text-dark">{e.rut}</span>,
    },
    {
      key: 'contacto',
      header: 'Contacto',
      headerClassName: 'hidden md:table-cell px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'hidden md:table-cell',
      cell: (e) => (
        <div className="flex items-center text-sm text-dark">
          <Phone className="h-4 w-4 mr-2 text-gray-400" />
          {e.phone}
        </div>
      ),
    },
    {
      key: 'direccion',
      header: 'Dirección',
      headerClassName: 'hidden lg:table-cell px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'hidden lg:table-cell',
      cell: (e) => (
        <div className="flex items-start text-sm text-dark">
          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{e.address}</span>
        </div>
      ),
    },
    ...(canManageEnterprises
      ? [
          {
            key: 'actions',
            header: <span className="text-right block">Acciones</span>,
            cell: (e: Enterprise) => (
              <div className="flex items-center justify-end space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      onClick={() => router.push(`/empresas/${e.id}`)}
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
                      className="h-9 w-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      onClick={() => setEditModal({ open: true, enterpriseId: e.id })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100"
                      disabled={isDeleting}
                      onClick={() => setDeleteDialog({ isOpen: true, enterprise: e })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar</TooltipContent>
                </Tooltip>
              </div>
            ),
            className: 'text-right',
          } as ColumnDef<Enterprise>,
        ]
      : []),
  ];

  return (
    <ErrorBoundary>
      <PageLayout
        icon={Building2}
        title="Empresas"
        subtitle="Gestiona las empresas del sistema"
        requiredPermissions={['enterprises.read.all', 'enterprises.read.own']}
        permissionMatch="any"
        actions={
          canManageEnterprises ? (
            <Button onClick={() => setCreateModal(true)} className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nueva Empresa</span>
            </Button>
          ) : undefined
        }
      >
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={(v) => setSearchTerm(v)}
          searchPlaceholder="Buscar empresas por nombre o RUT..."
        />

        <ApiErrorDisplay error={error} onRetry={() => performSearch(searchTerm, currentPage)} onDismiss={clearErrors} className="mb-4" />
        <ApiErrorDisplay error={deleteError} onDismiss={clearErrors} className="mb-4" />

        <DataTable
          columns={columns}
          data={enterprises}
          isLoading={isLoading}
          emptyIcon={Building2}
          emptyTitle="No hay empresas"
          emptyMessage={
            searchTerm
              ? 'No se encontraron empresas que coincidan con tu búsqueda.'
              : 'Aún no hay empresas registradas.'
          }
          emptyAction={
            canManageEnterprises && !searchTerm ? (
              <Button onClick={() => setCreateModal(true)} className="btn-primary">
                Crear Primera Empresa
              </Button>
            ) : undefined
          }
          title="Empresas"
          count={enterprises.length}
          keyExtractor={(e) => e.id}
        />

        {pagination?.meta && pagination.meta.last_page > 1 && (
          <div className="mt-6">
            <UnifiedPagination
              meta={pagination.meta}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              itemName="empresas"
            />
          </div>
        )}

        <CreateEmpresaModal
          open={createModal}
          onOpenChange={setCreateModal}
          onCreated={() => performSearch(searchTerm, 1)}
        />

        <EditEmpresaModal
          open={editModal.open}
          onOpenChange={(open) => setEditModal(prev => ({ ...prev, open }))}
          enterpriseId={editModal.enterpriseId}
          onSaved={() => performSearch(searchTerm, currentPage)}
        />

        <ConfirmActionDialog
          isOpen={deleteDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDialog({ isOpen: false, enterprise: null });
              clearErrors();
            }
          }}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar la empresa "${deleteDialog.enterprise?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
          variant="danger"
        />
      </PageLayout>
    </ErrorBoundary>
  );
}
