'use client';

import { type PaginationMeta, type PaginationLinks } from '@/lib/interfaces';

interface MachineStylePaginationProps {
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  itemName?: string; // e.g., "máquinas", "usuarios"
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export default function MachineStylePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  itemName = "elementos",
  hasNextPage,
  hasPrevPage,
}: MachineStylePaginationProps) {
  if (!pagination?.meta) {
    return null;
  }

  const { meta } = pagination;

  return (
    <div className="card p-6 border-t border-gray-100">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Info de paginación */}
        <div className="text-sm font-medium text-gray-700">
          Mostrando <span className="font-semibold text-gray-900">{meta.from || 0}</span> a <span className="font-semibold text-gray-900">{meta.to || 0}</span> de <span className="font-semibold text-gray-900">{meta.total}</span> {itemName}
        </div>
        
        {/* Controles de paginación */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <nav className="flex items-center" aria-label="Pagination">
            {/* Botón Primera página */}
            <button
              onClick={() => onPageChange(1)}
              disabled={meta.current_page === 1 || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-l-md transition-all duration-200 ${
                meta.current_page === 1 || isLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              ««
            </button>
            
            {/* Botón Anterior */}
            <button
              onClick={() => onPageChange(meta.current_page - 1)}
              disabled={!hasPrevPage() || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                !hasPrevPage() || isLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              «
            </button>
            
            {/* Números de página */}
            {meta.links
              .filter(link => link.page && !isNaN(Number(link.label)))
              .map((link) => (
                <button
                  key={link.page}
                  onClick={() => onPageChange(link.page!)}
                  disabled={isLoading}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                    link.active
                      ? 'bg-primary text-white border-primary hover:bg-primary/90'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
                  } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {link.label}
                </button>
              ))}
            
            {/* Botón Siguiente */}
            <button
              onClick={() => onPageChange(meta.current_page + 1)}
              disabled={!hasNextPage() || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                !hasNextPage() || isLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              »
            </button>
            
            {/* Botón Última página */}
            <button
              onClick={() => onPageChange(meta.last_page)}
              disabled={meta.current_page === meta.last_page || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-r-md transition-all duration-200 ${
                meta.current_page === meta.last_page || isLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              »»
            </button>
          </nav>
          
          {/* Selector de tamaño de página */}
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700">
              Mostrar:
            </label>
            <select
              id="page-size"
              value={meta.per_page}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="block w-auto rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isLoading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">por página</span>
          </div>
        </div>
      </div>
    </div>
  );
}
