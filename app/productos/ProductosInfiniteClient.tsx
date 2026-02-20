'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Package, Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { PageLayout, DataTable, FilterBar, ConfirmActionDialog, UnifiedPagination } from '@/components/ui-custom';
import type { ColumnDef } from '@/components/ui-custom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductStore } from '@/lib/stores/productStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { useMqttProduct } from '@/lib/hooks/useMqttProduct';
import { useUser } from '@/lib/stores/authStore';
import type { Producto as Product } from '@/lib/interfaces/product.interface';

const DEFAULT_PAGE_SIZE = 20;

const formatDate = (date?: string) => {
  if (!date) return 'Sin registro';
  try {
    return new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
};

export default function ProductosInfiniteClient() {
  const user = useUser();
  const canCreate = user?.role === 'admin' || (user?.permissions ?? []).includes('products.create');
  const canEdit = user?.role === 'admin' || (user?.permissions ?? []).includes('products.update');
  const canDelete = user?.role === 'admin' || (user?.permissions ?? []).includes('products.delete');

  const {
    products,
    pagination,
    isLoading,
    error,
    fetchProducts,
    refreshProducts,
    currentFilters,
    setFilters,
    clearError,
    deleteProduct,
    isDeleting,
    deleteError,
    clearDeleteError,
  } = useProductStore();
  const { publishProductOperation, isPublishing } = useMqttProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string | number | null;
    productName: string;
    enterpriseId: number | null;
  }>({ isOpen: false, productId: null, productName: '', enterpriseId: null });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const initialFilters = { page: 1, limit: DEFAULT_PAGE_SIZE };
    initializedRef.current = true;
    setFilters(initialFilters);
    fetchProducts(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) notify.error(`Error al cargar productos: ${error}`);
  }, [error]);

  useEffect(() => {
    if (deleteError) notify.error(`Error al eliminar producto: ${deleteError}`);
  }, [deleteError]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const baseFilters = { ...currentFilters, page: 1, limit: DEFAULT_PAGE_SIZE };
    const filters = debouncedSearchTerm
      ? { ...baseFilters, searchObj: { value: debouncedSearchTerm, case_sensitive: false }, search: debouncedSearchTerm }
      : { ...baseFilters, search: undefined, searchObj: undefined };
    setFilters(filters);
    fetchProducts(filters);
  }, [debouncedSearchTerm, currentFilters.limit, fetchProducts, setFilters]);

  const handlePageChange = useCallback(
    async (page: number) => {
      const newFilters = { ...currentFilters, page };
      setFilters(newFilters);
      await fetchProducts(newFilters);
    },
    [currentFilters, setFilters, fetchProducts]
  );

  const handlePageSizeChange = useCallback(
    async (limit: number) => {
      const newFilters = { ...currentFilters, page: 1, limit };
      setFilters(newFilters);
      await fetchProducts(newFilters);
    },
    [currentFilters, setFilters, fetchProducts]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.productId || !deleteDialog.enterpriseId) {
      notify.error('Producto inválido para eliminar vía MQTT.');
      return;
    }
    const success = await deleteProduct(deleteDialog.productId);
    if (success) {
      try {
        await publishProductOperation('delete', {
          id: deleteDialog.productId,
          enterprise_id: deleteDialog.enterpriseId,
        });
      } catch (mqttError) {
        console.error('Error al notificar eliminación por MQTT:', mqttError);
        notify.error('Producto eliminado, pero falló la notificación MQTT.');
        setDeleteDialog({ isOpen: false, productId: null, productName: '', enterpriseId: null });
        return;
      }
      notify.success(`Producto "${deleteDialog.productName}" eliminado exitosamente`);
      setDeleteDialog({ isOpen: false, productId: null, productName: '', enterpriseId: null });
    } else {
      notify.error(`Error al eliminar el producto "${deleteDialog.productName}"`);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'producto',
      header: 'Producto',
      cell: (p) => (
        <Link href={`/productos/${p.id}`} className="flex items-center group">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-dark group-hover:text-primary transition-colors">{p.name}</div>
            <div className="text-sm text-muted">ID: {p.id}</div>
          </div>
        </Link>
      ),
    },
    {
      key: 'creado',
      header: 'Creado',
      headerClassName: 'hidden sm:table-cell px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'hidden sm:table-cell',
      cell: (p) => <span className="text-sm text-dark">{formatDate(p.created_at)}</span>,
    },
    {
      key: 'actualizado',
      header: 'Actualizado',
      headerClassName: 'hidden sm:table-cell px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'hidden sm:table-cell',
      cell: (p) => <span className="text-sm text-dark">{formatDate(p.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: <span className="text-right block">Acciones</span>,
      cell: (p) => (
        <div className="flex items-center justify-end space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/productos/${p.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
                <Eye className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Ver detalles</TooltipContent>
          </Tooltip>
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/productos/${p.id}/editar`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-green-600 hover:bg-green-50 transition-colors">
                  <Edit className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                  disabled={isDeleting || isPublishing}
                  onClick={() => setDeleteDialog({ isOpen: true, productId: p.id, productName: p.name, enterpriseId: p.enterprise_id ?? null })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <PageLayout
      icon={Package}
      title="Gestión de Productos"
      subtitle="Administra el inventario de las máquinas expendedoras"
      requiredPermissions={['products.read.all', 'products.read.enterprise_owned']}
      permissionMatch="any"
      actions={
        canCreate ? (
          <Link href="/productos/crear" className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </Link>
        ) : undefined
      }
    >
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error al cargar productos</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={clearError} className="ml-auto btn-secondary text-sm mr-2">Limpiar</button>
            <button onClick={() => refreshProducts()} className="btn-secondary text-sm">Reintentar</button>
          </div>
        </div>
      )}

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar productos por nombre..."
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyIcon={Package}
        emptyTitle="No se encontraron productos"
        emptyMessage={
          products.length === 0
            ? 'No hay productos registrados en el sistema.'
            : 'Intenta ajustar los filtros de búsqueda.'
        }
        title="Lista de Productos"
        count={pagination?.meta?.total ?? products.length}
        keyExtractor={(p) => p.id}
      />

      {pagination?.meta && (
        <div className="mt-6">
          <UnifiedPagination
            meta={pagination.meta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            itemName="productos"
          />
        </div>
      )}

      <ConfirmActionDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ isOpen: false, productId: null, productName: '', enterpriseId: null });
            clearDeleteError();
          }
        }}
        title="Eliminar Producto"
        description={`¿Estás seguro de que deseas eliminar el producto "${deleteDialog.productName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting || isPublishing}
        variant="danger"
      />
    </PageLayout>
  );
}
