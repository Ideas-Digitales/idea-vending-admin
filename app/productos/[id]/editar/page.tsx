'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, Save, Loader2, Edit } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useProductStore } from '@/lib/stores/productStore';
import { notify } from '@/lib/adapters/notification.adapter';
import type { UpdateProductFormData } from '@/lib/schemas/product.schema';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  
  console.log('Parámetros de la URL:', params);
  console.log('ID del producto extraído:', productId);
  
  // Store state
  const {
    selectedProduct: product,
    isLoadingProduct: isLoading,
    productError: error,
    isUpdating,
    updateError,
    fetchProduct,
    updateProduct,
    clearProductError,
    clearSelectedProduct,
    clearUpdateError
  } = useProductStore();

  // Form state
  const [formData, setFormData] = useState<UpdateProductFormData>({
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!productId) return;
    
    // Limpiar producto anterior y errores
    clearSelectedProduct();
    clearProductError();
    
    // Cargar producto usando el store
    fetchProduct(productId);
  }, [productId, fetchProduct, clearSelectedProduct, clearProductError]);

  // Inicializar formulario cuando se carga el producto
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
      });
    }
  }, [product]);

  // Limpiar producto al desmontar el componente
  useEffect(() => {
    return () => {
      clearSelectedProduct();
      clearProductError();
      clearUpdateError();
    };
  }, [clearSelectedProduct, clearProductError, clearUpdateError]);

  // Mostrar errores de actualización
  useEffect(() => {
    if (updateError) {
      notify.error(`Error al actualizar producto: ${updateError}`);
    }
  }, [updateError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    clearUpdateError();

    console.log('Formulario: Iniciando actualización');
    console.log('Formulario: productId =', productId);
    console.log('Formulario: formData =', formData);

    try {
      const success = await updateProduct(productId, formData);
      console.log('Formulario: Resultado de updateProduct =', success);
      
      if (success) {
        notify.success('Producto actualizado exitosamente');
        // Redirect to product details
        window.location.href = `/productos/${productId}`;
      }
    } catch (error) {
      console.log('Formulario: Error en updateProduct =', error);
      notify.error('Error al actualizar producto');
    }
  };

  const handleBack = () => {
    clearSelectedProduct();
    clearProductError();
    clearUpdateError();
    window.location.href = `/productos/${productId}`;
  };

  // Mostrar loading si está cargando O si no hay producto y no hay error
  if (isLoading || (!product && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando producto...</p>
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
              Volver
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
            <p className="text-muted mb-4">El producto solicitado no existe.</p>
            <Link href="/productos" className="btn-primary">
              Volver a productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Editar Producto</h1>
                  <p className="text-muted">Modificar información del producto: {product.name}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Información del Producto
              </h3>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Coca Cola 350ml"
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    required
                    disabled={isUpdating}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex items-center justify-center space-x-2"
                    disabled={isUpdating}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                  
                  <button
                    type="submit"
                    className="btn-primary flex items-center justify-center space-x-2"
                    disabled={isUpdating || !formData.name.trim()}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
