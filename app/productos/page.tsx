import { Package, AlertCircle } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { getProductsAction, type Producto } from '@/lib/actions/products';
import ProductosInfiniteClient from './ProductosInfiniteClient';

async function ProductosContent() {
  // Obtener primera página de productos para inicializar
  const productsResponse = await getProductsAction({ page: 1 });

  if (!productsResponse.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Productos</h1>
                  <p className="text-muted">Administra el inventario de las máquinas expendedoras</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="card p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar productos</h3>
              <p className="text-muted mb-4">{productsResponse.error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                Reintentar
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const productos = productsResponse.products || [];

  return (
    <ProductosInfiniteClient 
      initialProducts={productos} 
      initialPagination={productsResponse.pagination}
    />
  );
}

export default function ProductosPage() {
  return (
    <PageWrapper requiredPermissions={['read']}>
      <ProductosContent />
    </PageWrapper>
  );
}
