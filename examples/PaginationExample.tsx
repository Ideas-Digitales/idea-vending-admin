// Ejemplo de uso de la paginación integrada con userStore
'use client';

import { useUserStorePagination } from '@/components/UserStorePagination';
import UserStorePagination from '@/components/UserStorePagination';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Ejemplo 1: Usando el componente UserStorePagination directamente
export function SimpleUserPagination() {
  return (
    <div className="space-y-4">
      <h3>Paginación Simple</h3>
      <UserStorePagination simple />
    </div>
  );
}

// Ejemplo 2: Usando el componente UserStorePagination completo
export function FullUserPagination() {
  return (
    <div className="space-y-4">
      <h3>Paginación Completa</h3>
      <UserStorePagination />
    </div>
  );
}

// Ejemplo 3: Usando el hook personalizado para crear controles custom
export function CustomPaginationControls() {
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoading,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    pagination,
  } = useUserStorePagination();

  if (!pagination) {
    return <div>No hay datos de paginación</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <h3>Controles de Paginación Personalizados</h3>
      
      {/* Información de página */}
      <div className="text-sm text-gray-600">
        Página {currentPage} de {totalPages}
        {pagination.meta && (
          <span className="ml-2">
            ({pagination.meta.from}-{pagination.meta.to} de {pagination.meta.total} elementos)
          </span>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center space-x-2">
        {/* Primera página */}
        <button
          onClick={goToFirstPage}
          disabled={!hasPrevPage || isLoading}
          className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Página anterior */}
        <button
          onClick={goToPrevPage}
          disabled={!hasPrevPage || isLoading}
          className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Input directo de página */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">Ir a:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                goToPage(page);
              }
            }}
            className="w-16 px-2 py-1 text-sm border rounded-md text-center"
            disabled={isLoading}
          />
        </div>

        {/* Página siguiente */}
        <button
          onClick={goToNextPage}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Última página */}
        <button
          onClick={goToLastPage}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando...</span>
        </div>
      )}

      {/* Navegación rápida */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Ir a página:</span>
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            disabled={isLoading}
            className={`
              px-3 py-1 text-sm rounded-md border
              ${page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50 disabled:opacity-50'
              }
            `}
          >
            {page}
          </button>
        ))}
        {totalPages > 10 && (
          <span className="text-sm text-gray-400">...</span>
        )}
      </div>
    </div>
  );
}

// Ejemplo 4: Paginación con información detallada
export function DetailedPaginationInfo() {
  const { pagination, isLoading } = useUserStorePagination();

  if (!pagination?.meta) {
    return null;
  }

  const { meta } = pagination;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">Información de Paginación</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Página actual:</span> {meta.current_page}
        </div>
        <div>
          <span className="font-medium">Total páginas:</span> {meta.last_page}
        </div>
        <div>
          <span className="font-medium">Elementos por página:</span> {meta.per_page}
        </div>
        <div>
          <span className="font-medium">Total elementos:</span> {meta.total}
        </div>
        <div>
          <span className="font-medium">Desde:</span> {meta.from}
        </div>
        <div>
          <span className="font-medium">Hasta:</span> {meta.to}
        </div>
      </div>
      
      {isLoading && (
        <div className="mt-2 text-sm text-blue-600">
          ⏳ Actualizando datos...
        </div>
      )}
    </div>
  );
}
