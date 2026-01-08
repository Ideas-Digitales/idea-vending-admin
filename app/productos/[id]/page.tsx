'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, Calendar, Tag, Activity, Edit, Trash2, BarChart3, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useProductStore } from '@/lib/stores/productStore';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  
  // Store state
  const {
    selectedProduct: product,
    isLoadingProduct: isLoading,
    productError: error,
    fetchProduct,
    clearProductError,
    clearSelectedProduct
  } = useProductStore();

  useEffect(() => {
    if (!productId) return;
    
    // Limpiar producto anterior y errores
    clearSelectedProduct();
    clearProductError();
    
    // Cargar producto usando el store
    fetchProduct(productId);
  }, [productId, fetchProduct, clearSelectedProduct, clearProductError]);

  // Limpiar producto al desmontar el componente
  useEffect(() => {
    return () => {
      clearSelectedProduct();
      clearProductError();
    };
  }, [clearSelectedProduct, clearProductError]);

  const handleBack = () => {
    // Limpiar completamente el store antes de navegar
    clearSelectedProduct();
    clearProductError();
    
    // Forzar recarga completa de la página de productos
    window.location.href = '/productos';
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'bebidas': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'snacks': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dulces': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'saludable': return 'bg-green-100 text-green-800 border-green-200';
      case 'lácteos': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'panadería': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600', label: 'Sin stock', bgColor: 'bg-red-100', borderColor: 'border-red-200' };
    if (stock < 10) return { color: 'text-orange-600', label: 'Stock bajo', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' };
    if (stock < 30) return { color: 'text-yellow-600', label: 'Stock medio', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200' };
    return { color: 'text-green-600', label: 'Stock bueno', bgColor: 'bg-green-100', borderColor: 'border-green-200' };
  };

  // Mostrar loading si está cargando O si no hay producto y no hay error
  if (isLoading || (!product && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles del producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar producto</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Producto no encontrado</h3>
            <p className="text-muted mb-4">El producto solicitado no existe o no tienes permisos para verlo.</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock || 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Detalles del Producto</h1>
                  <p className="text-muted">Información completa y gestión del producto</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.location.href = `/productos/${productId}/editar`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button className="btn-danger flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Product Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{product.name}</h2>
                    <p className="text-muted">ID: {product.id}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      {product.category && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(product.category)}`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(product.is_active || false)}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.bgColor} ${stockStatus.color} ${stockStatus.borderColor}`}>
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  Información del Producto
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-dark">{product.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <p className="text-dark">{product.description || 'Sin descripción'}</p>
                    <span className="text-xs text-orange-600 mt-1 block">MOCK - Pendiente en API</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                    <p className="text-dark font-mono">{product.barcode || 'N/A'}</p>
                    <span className="text-xs text-orange-600 mt-1 block">MOCK - Pendiente en API</span>
                  </div>
                </div>
              </div>

              {/* Commercial Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  Información Comercial
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <p className="text-dark flex items-center text-xl font-semibold">
                      <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                      {product.price?.toLocaleString('es-CL') || 'N/A'}
                    </p>
                    <span className="text-xs text-orange-600 mt-1 block">MOCK - Pendiente en API</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    {product.category ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                    ) : (
                      <p className="text-gray-500">Sin categoría</p>
                    )}
                    <span className="text-xs text-orange-600 mt-1 block">MOCK - Pendiente en API</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(product.is_active || false)}`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-xs text-orange-600 mt-1 block">MOCK - Pendiente en API</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Stock Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Información de Inventario
                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">MOCK</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-dark mb-1">{product.stock || 0}</div>
                  <div className="text-sm text-muted">Unidades disponibles</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold mb-1 ${stockStatus.color}`}>
                    {stockStatus.label}
                  </div>
                  <div className="text-sm text-muted">Estado del stock</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-dark mb-1">{product.enterprise_id}</div>
                  <div className="text-sm text-muted">ID Empresa</div>
                </div>
              </div>
              {(product.stock || 0) < 10 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-yellow-800 font-medium">Stock bajo</p>
                    <p className="text-yellow-700 text-sm">Este producto necesita reposición pronto.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Información de Registro
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-dark">{new Date(product.created_at).toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                  <p className="text-dark">{new Date(product.updated_at).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
