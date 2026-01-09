'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plus, Search, Edit, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useProductStore } from '@/lib/stores/productStore';
import ProductStorePagination from '@/components/ProductStorePagination';
import ProductPageSkeleton from '@/components/skeletons/ProductPageSkeleton';
import { notify } from '@/lib/adapters/notification.adapter';

const DEFAULT_PAGE_SIZE = 20;

export default function ProductosInfiniteClient() {
  const router = useRouter();
  // Store state
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

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string | number | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: ''
  });
  
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    // FORZAR limit a DEFAULT_PAGE_SIZE para corregir valores antiguos en localStorage
    const initialFilters = {
      page: 1,
      limit: DEFAULT_PAGE_SIZE, // Siempre usar 20, ignorar valor en localStorage
    };
    initializedRef.current = true;
    setFilters(initialFilters);
    fetchProducts(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mostrar toast para errores
  useEffect(() => {
    if (error) {
      notify.error(`Error al cargar productos: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (deleteError) {
      notify.error(`Error al eliminar producto: ${deleteError}`);
    }
  }, [deleteError]);
  

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const baseFilters = {
      ...currentFilters,
      page: 1,
      limit: DEFAULT_PAGE_SIZE, // Siempre forzar a 20
    };

    const filters =
      debouncedSearchTerm
        ? {
            ...baseFilters,
            searchObj: {
              value: debouncedSearchTerm,
              case_sensitive: false,
            },
            search: debouncedSearchTerm,
          }
        : {
            ...baseFilters,
            search: undefined,
            searchObj: undefined,
          };

    setFilters(filters);
    fetchProducts(filters);
  }, [debouncedSearchTerm, currentFilters.limit, fetchProducts, setFilters]);

  const displayedProducts = products;

  const handleViewProduct = (productId: string | number) => {
    router.push(`/productos/${productId}`);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Sin registro';
    try {
      return new Date(date).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('No se pudo formatear fecha', date, error);
      return date;
    }
  };

  // Delete handlers
  const handleDeleteClick = (productId: string | number, productName: string) => {
    setDeleteDialog({
      isOpen: true,
      productId,
      productName
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.productId) {
      const success = await deleteProduct(deleteDialog.productId);
      if (success) {
        notify.success(`Producto "${deleteDialog.productName}" eliminado exitosamente`);
        setDeleteDialog({ isOpen: false, productId: null, productName: '' });
      } else {
        notify.error(`Error al eliminar el producto "${deleteDialog.productName}"`);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, productId: null, productName: '' });
    clearDeleteError();
  };


  const handleRefresh = () => {
    refreshProducts();
  };

  // Mostrar skeleton solo durante la carga inicial
  const showSkeleton = isLoading && products.length === 0;
  
  if (showSkeleton) {
    return <ProductPageSkeleton />;
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
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Productos</h1>
                  <p className="text-muted">Administra el inventario de las máquinas expendedoras</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    console.log('🔄 Forzando recarga de productos...');
                    localStorage.removeItem('product-store');
                    fetchProducts({ page: 1, limit: 100 });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Loader2 className="h-4 w-4" />
                  <span>Recargar</span>
                </button>
                <Link 
                  href="/productos/crear"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Producto</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="relative">
          {/* Search */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-600"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                )}
              </div>

            </div>
          </div>

          {error && (
            <div className="px-6 py-4">
              <div className="card p-6 bg-red-50 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error al cargar productos</h3>
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

          {/* Products Table */}
          <div className="px-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">
                    Lista de Productos
                  </h3>
                  <span className="text-sm text-muted">
                    Total: {pagination?.meta?.total ?? products.length}
                  </span>
                </div>
              </div>
              
              {displayedProducts.length === 0 && !isLoading ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark mb-2">No se encontraron productos</h3>
                  <p className="text-muted">
                    {products.length === 0 
                      ? 'No hay productos registrados en el sistema.'
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
                            Producto
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actualizado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedProducts.map((producto) => (
                        <tr key={producto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-dark">{producto.name}</div>
                                <div className="text-sm text-muted">ID: {producto.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-dark">
                              #{producto.enterprise_id ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            {formatDate(producto.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            {formatDate(producto.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewProduct(producto.id)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <Link
                                href={`/productos/${producto.id}/editar`}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(producto.id, producto.name)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
              )}
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="px-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted">Cargando productos...</span>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          <ProductStorePagination className="px-6 py-4" />

          {/* Bottom spacing */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${deleteDialog.productName}"? Esta acción no se puede deshacer.`}
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
