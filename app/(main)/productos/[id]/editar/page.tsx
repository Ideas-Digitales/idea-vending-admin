'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Save, Loader2, Edit } from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import Link from 'next/link';
import { useProductStore } from '@/lib/stores/productStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { useMqttProduct } from '@/lib/hooks/useMqttProduct';
import type { UpdateProductFormData } from '@/lib/schemas/product.schema';
import { uploadProductImage } from '@/lib/utils/imageUpload';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

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
  const { publishProductOperation, isPublishing } = useMqttProduct();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProductFormData>({
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!productId) return;

    clearSelectedProduct();
    clearProductError();
    fetchProduct(productId);
  }, [productId, fetchProduct, clearSelectedProduct, clearProductError]);

  useEffect(() => {
    if (product) {
      setFormData({ name: product.name });
      setImagePreview(product.image ?? null);
    }
  }, [product]);

  useEffect(() => {
    return () => {
      clearSelectedProduct();
      clearProductError();
      clearUpdateError();
    };
  }, [clearSelectedProduct, clearProductError, clearUpdateError]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (updateError) {
      notify.error(`Error al actualizar producto: ${updateError}`);
    }
  }, [updateError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    clearUpdateError();

    try {
      const success = await updateProduct(productId, formData);

      if (success) {
        if (imageFile) {
          await uploadProductImage(productId, imageFile);
        }
        if (product) {
          try {
            await publishProductOperation('update', {
              id: product.id,
              enterprise_id: product.enterprise_id,
              name: formData.name || product.name,
            });
          } catch (mqttError) {
            console.error('Error sincronizando producto via MQTT:', mqttError);
            notify.error('Producto actualizado, pero falló la sincronización MQTT. Intenta nuevamente.');
            return;
          }
        }

        notify.success('Producto actualizado y sincronizado exitosamente');
        localStorage.removeItem('product-store');
        window.location.href = '/productos';
      }
    } catch (error) {
      notify.error('Error al actualizar producto');
    }
  };

  if (isLoading || (!product && !error)) {
    return (
      <>
        <PageHeader icon={Edit} title="Editar Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando producto...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader icon={Edit} title="Editar Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar producto</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link href="/productos" className="btn-primary">Volver</Link>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageHeader icon={Edit} title="Editar Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Producto no encontrado</h3>
            <p className="text-muted mb-4">El producto solicitado no existe.</p>
            <Link href="/productos" className="btn-primary">Volver a productos</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={Edit}
        title="Editar Producto"
        subtitle={`Modificar información del producto: ${product.name}`}
        backHref={`/productos/${productId}`}
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-dark mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary" />
              Información del Producto
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen referencial
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                    setImagePreview(file ? URL.createObjectURL(file) : product?.image ?? null);
                  }}
                  className="input-field"
                  disabled={isUpdating || isPublishing}
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={formData.name || product.name}
                    className="mt-3 h-36 w-full rounded-xl border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="mt-3 h-36 w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                    <Package className="h-10 w-10" />
                  </div>
                )}
              </div>

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

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href={`/productos/${productId}`}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <span>Cancelar</span>
                </Link>

                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2"
                  disabled={isUpdating || isPublishing || !formData.name.trim()}
                >
                  {isUpdating || isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isPublishing ? 'Sincronizando...' : 'Actualizando...'}</span>
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
    </>
  );
}
