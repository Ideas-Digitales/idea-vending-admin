'use client';

import { useUserStore } from '@/lib/stores/userStore';
import Pagination, { SimplePagination } from './Pagination';

interface UserStorePaginationProps {
  className?: string;
  simple?: boolean; // Si true, usa SimplePagination
}

export default function UserStorePagination({ 
  className = '', 
  simple = false 
}: UserStorePaginationProps) {
  const {
    pagination,
    currentFilters,
    setFilters,
    fetchUsers,
    isLoading,
  } = useUserStore();

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
    
    // Cargar usuarios con los nuevos filtros
    await fetchUsers(newFilters);
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
export function useUserStorePagination() {
  const {
    pagination,
    currentFilters,
    setFilters,
    fetchUsers,
    hasNextPage,
    hasPrevPage,
    isLoading,
  } = useUserStore();

  const goToPage = async (page: number) => {
    const newFilters = { ...currentFilters, page };
    setFilters(newFilters);
    await fetchUsers(newFilters);
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
