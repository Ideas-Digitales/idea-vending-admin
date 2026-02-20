'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Calendar, Building2, Edit } from 'lucide-react';
import { useProductStore } from '@/lib/stores/productStore';
import { getEnterpriseAction } from '@/lib/actions/enterprise';
import { AppShell, PageHeader } from '@/components/ui-custom';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const {
    selectedProduct: product,
    isLoadingProduct: isLoading,
    productError: error,
    fetchProduct,
    clearProductError,
    clearSelectedProduct
  } = useProductStore();

  const [enterpriseName, setEnterpriseName] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    clearSelectedProduct();
    clearProductError();
    fetchProduct(productId);
  }, [productId, fetchProduct, clearSelectedProduct, clearProductError]);

  useEffect(() => {
    return () => {
      clearSelectedProduct();
      clearProductError();
    };
  }, [clearSelectedProduct, clearProductError]);

  useEffect(() => {
    if (!product?.enterprise_id) return;

    getEnterpriseAction(product.enterprise_id).then((res) => {
      if (res.success && res.enterprise) {
        setEnterpriseName(res.enterprise.name);
      }
    });
  }, [product?.enterprise_id]);

  if (isLoading || (!product && !error)) {
    return (
      <AppShell>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles del producto...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar producto</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link href="/productos" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Producto no encontrado</h3>
            <p className="text-muted mb-4">El producto solicitado no existe o no tienes permisos para verlo.</p>
            <Link href="/productos" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon={Package}
        title="Detalles del Producto"
        subtitle="Información completa del producto"
        backHref="/productos"
        variant="white"
        actions={
          <Link
            href={`/productos/${productId}/editar`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Link>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Product header card */}
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark">{product.name}</h2>
                <p className="text-muted">ID: {product.id}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del producto */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Información del Producto
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-dark">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Producto</label>
                  <p className="text-dark font-mono">{product.id}</p>
                </div>
              </div>
            </div>

            {/* Empresa */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Empresa
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
                {enterpriseName ? (
                  <p className="text-dark">{enterpriseName}</p>
                ) : (
                  <p className="text-muted text-sm">Cargando...</p>
                )}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Información de Registro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                <p className="text-dark">
                  {product.created_at ? new Date(product.created_at).toLocaleString('es-ES') : 'No disponible'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                <p className="text-dark">
                  {product.updated_at ? new Date(product.updated_at).toLocaleString('es-ES') : 'No disponible'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </AppShell>
  );
}
