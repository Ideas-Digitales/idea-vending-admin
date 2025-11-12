'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plus, Search, Edit, Trash2, Eye, ShoppingCart, DollarSign, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useProductStore } from '@/lib/stores/productStore';
import ProductStorePagination from '@/components/ProductStorePagination';
import ProductPageSkeleton from '@/components/skeletons/ProductPageSkeleton';
import { notify } from '@/lib/adapters/notification.adapter';

export default function ProductosInfiniteClient() {
  const router = useRouter();
  // Store state
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    refreshProducts,
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
  

  useEffect(() => {
    // Solo cargar productos si no hay datos y no estamos cargando
    if (products.length === 0 && !isLoading && !error) {
      fetchProducts();
    }
  }, [products.length, isLoading, error, fetchProducts]);

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

  const apiFilters = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    page: 1,
  }), [debouncedSearchTerm]);

  const prevFiltersRef = useRef(apiFilters);
  const applyFilters = useCallback((filters: typeof apiFilters) => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged) {
      setFilters(filters);
      fetchProducts(filters);
      prevFiltersRef.current = filters;
    }
  }, [setFilters, fetchProducts]);
  
  const apiFiltersString = JSON.stringify(apiFilters);
  
  useEffect(() => {
    if (products.length > 0) {
      applyFilters(apiFilters);
    }
  }, [apiFiltersString, applyFilters, products.length]);

  const displayedProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    
    if (searchTerm !== debouncedSearchTerm) {
      return products.filter(producto => 
        producto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.description && producto.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (producto.category && producto.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return products;
  }, [products, searchTerm, debouncedSearchTerm]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'bebidas': return 'bg-blue-100 text-blue-800';
      case 'snacks': return 'bg-orange-100 text-orange-800';
      case 'dulces': return 'bg-pink-100 text-pink-800';
      case 'saludable': return 'bg-green-100 text-green-800';
      case 'lácteos': return 'bg-purple-100 text-purple-800';
      case 'panadería': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600', label: 'Sin stock' };
    if (stock < 10) return { color: 'text-orange-600', label: 'Stock bajo' };
    if (stock < 30) return { color: 'text-yellow-600', label: 'Stock medio' };
    return { color: 'text-green-600', label: 'Stock bueno' };
  };

  const handleViewProduct = (productId: string | number) => {
    router.push(`/productos/${productId}`);
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

  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Marcar como inicializado cuando tengamos datos o cuando termine la carga inicial
  useEffect(() => {
    if (products.length > 0 || (!isLoading && isInitialized)) {
      setIsInitialized(true);
      setShowSkeleton(false);
    }
  }, [products.length, isLoading, isInitialized]);

  useEffect(() => {
    // Solo mostrar skeleton en la carga inicial si no hay datos persistidos
    if (isLoading && products.length === 0 && !error && !isInitialized) {
      setShowSkeleton(true);
      const timeout = setTimeout(() => {
        setShowSkeleton(false);
        setIsInitialized(true);
      }, 3000); // Reducido a 3 segundos
      
      return () => clearTimeout(timeout);
    } else if (products.length > 0 || error) {
      setShowSkeleton(false);
      setIsInitialized(true);
    }
  }, [isLoading, products.length, error, isInitialized]);
  
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
              <Link 
                href="/productos/crear"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Producto</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative">
          {/* Stats Cards - Solo datos básicos */}
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-muted">Productos Cargados</p>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">LOCAL</span>
                    </div>
                    <p className="text-2xl font-bold text-dark">{products.length}</p>
                    <p className="text-xs text-muted mt-1">
                      En esta vista
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-4">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-muted">Búsqueda Activa</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">LOCAL</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {searchTerm ? 'Sí' : 'No'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {searchTerm ? `"${searchTerm}"` : 'Mostrando todos'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 flex-shrink-0 ml-4">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    {displayedProducts.length !== products.length && (
                      <span className="text-sm font-normal text-muted ml-2">
                        ({displayedProducts.length} de {products.length} mostrados)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full mr-2">API</span>
                      <span className="text-muted">Datos reales del servidor</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full mr-2">MOCK</span>
                      <span className="text-muted">Datos simulados</span>
                    </div>
                  </div>
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
                          <div className="flex items-center">
                            Descripción
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Categoría
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Precio
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Stock
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            Estado
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedProducts.map((producto) => {
                        const stockStatus = getStockStatus(producto.stock || 0);
                        return (
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
                            <td className="px-6 py-4">
                              <div className="text-sm text-dark max-w-xs truncate">
                                {producto.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(producto.category || '')}`}>
                                {producto.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                <span className="text-sm font-medium text-dark">
                                  {producto.price?.toLocaleString('es-CL')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${stockStatus.color}`}>
                                  {producto.stock} unidades
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                producto.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {producto.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  onClick={() => handleViewProduct(producto.id)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    console.log('Editando producto con ID:', producto.id);
                                    console.log('Producto completo:', producto);
                                    window.location.href = `/productos/${producto.id}/editar`;
                                  }}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Editar producto"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                  title="Eliminar producto"
                                  onClick={() => handleDeleteClick(producto.id, producto.name)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
