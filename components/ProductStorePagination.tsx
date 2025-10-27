'use client';

import { useProductStore } from '@/lib/stores/productStore';
import Pagination, { SimplePagination } from './Pagination';

interface ProductStorePaginationProps {
  className?: string;
  simple?: boolean; // Si true, usa SimplePagination
}

export default function ProductStorePagination({ 
  className = '', 
  simple = false 
}: ProductStorePaginationProps) {
  const {
    pagination,
    currentFilters,
    setFilters,
    fetchProducts,
    isLoading,
  } = useProductStore();

  // Si no hay información de paginación, no mostrar nada
  if (!pagination?.meta) {
    return null;
  }

  const handlePageChange = async (page: number) => {
    // Crear nuevos filtros con la página actualizada
    const newFilters = {
      ...currentFilters,
      page,
    };

    // Actualizar filtros en el store
    setFilters(newFilters);
    
    // Cargar productos con los nuevos filtros
    await fetchProducts(newFilters);
  };

  const PaginationComponent = simple ? SimplePagination : Pagination;

  return (
    <div className={className}>
      <PaginationComponent
        meta={pagination.meta}
        onPageChange={handlePageChange}
      />
      
      {/* Indicador de carga opcional */}
      {isLoading && (
        <div className="flex items-center justify-center mt-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted">Cargando...</span>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para usar la paginación del store directamente
export function useProductStorePagination() {
  const {
    pagination,
    currentFilters,
    setFilters,
    fetchProducts,
    hasNextPage,
    hasPrevPage,
    isLoading,
  } = useProductStore();

  const goToPage = async (page: number) => {
    const newFilters = { ...currentFilters, page };
    setFilters(newFilters);
    await fetchProducts(newFilters);
  };

  const goToNextPage = async () => {
    if (hasNextPage() && pagination?.meta) {
      await goToPage(pagination.meta.current_page + 1);
    }
  };

  const goToPrevPage = async () => {
    if (hasPrevPage() && pagination?.meta) {
      await goToPage(pagination.meta.current_page - 1);
    }
  };

  const goToFirstPage = async () => {
    await goToPage(1);
  };

  const goToLastPage = async () => {
    if (pagination?.meta) {
      await goToPage(pagination.meta.last_page);
    }
  };

  return {
    pagination,
    currentPage: pagination?.meta?.current_page || 1,
    totalPages: pagination?.meta?.last_page || 1,
    hasNextPage: hasNextPage(),
    hasPrevPage: hasPrevPage(),
    isLoading,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
  };
}
