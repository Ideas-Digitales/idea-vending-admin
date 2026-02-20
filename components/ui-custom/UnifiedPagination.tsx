'use client';

import { type PaginationLinks } from '@/lib/interfaces';

// Flexible meta interface — compatible with both user and enterprise pagination shapes
interface FlexibleMeta {
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
  total: number;
  per_page: number;
  links?: Array<{ url: string | null; label: string; page: number | null; active: boolean }>;
}

interface UnifiedPaginationProps {
  meta: FlexibleMeta;
  links?: PaginationLinks;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  itemName?: string;
}

export default function UnifiedPagination({
  meta,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  itemName = 'elementos',
}: UnifiedPaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  const hasNextPage = meta.current_page < meta.last_page;
  const hasPrevPage = meta.current_page > 1;

  const btnBase = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-lg transition-colors';
  const btnActive = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  const btnDisabled = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';

  return (
    <div className="card border-t border-gray-100">

      {/* ── Móvil ── */}
      <div className="sm:hidden px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onPageChange(meta.current_page - 1)}
            disabled={!hasPrevPage || isLoading}
            className={`${btnBase} flex-1 gap-1 ${!hasPrevPage || isLoading ? btnDisabled : btnActive}`}
          >
            ← Anterior
          </button>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap px-2">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            onClick={() => onPageChange(meta.current_page + 1)}
            disabled={!hasNextPage || isLoading}
            className={`${btnBase} flex-1 gap-1 ${!hasNextPage || isLoading ? btnDisabled : btnActive}`}
          >
            Siguiente →
          </button>
        </div>
        <p className="text-center text-xs text-gray-500">
          {meta.from ?? 0}–{meta.to ?? 0} de {meta.total} {itemName}
        </p>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:flex flex-col lg:flex-row items-center justify-between gap-3 px-6 py-4">
        <div className="text-sm font-medium text-gray-700">
          Mostrando{' '}
          <span className="font-semibold text-gray-900">{meta.from || 0}</span> a{' '}
          <span className="font-semibold text-gray-900">{meta.to || 0}</span> de{' '}
          <span className="font-semibold text-gray-900">{meta.total}</span> {itemName}
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center" aria-label="Pagination">
            <button
              onClick={() => onPageChange(1)}
              disabled={meta.current_page === 1 || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-l-md transition-all duration-200 ${
                meta.current_page === 1 || isLoading ? btnDisabled : btnActive
              }`}
            >
              ««
            </button>
            <button
              onClick={() => onPageChange(meta.current_page - 1)}
              disabled={!hasPrevPage || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                !hasPrevPage || isLoading ? btnDisabled : btnActive
              }`}
            >
              «
            </button>
            {(meta.links ?? [])
              .filter((link) => link.page != null && !isNaN(Number(link.label)))
              .map((link) => (
                <button
                  key={link.page}
                  onClick={() => onPageChange(link.page!)}
                  disabled={isLoading}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                    link.active
                      ? 'bg-primary text-white border-primary hover:bg-primary/90'
                      : `${btnActive} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`
                  }`}
                >
                  {link.label}
                </button>
              ))}
            <button
              onClick={() => onPageChange(meta.current_page + 1)}
              disabled={!hasNextPage || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r transition-all duration-200 ${
                !hasNextPage || isLoading ? btnDisabled : btnActive
              }`}
            >
              »
            </button>
            <button
              onClick={() => onPageChange(meta.last_page)}
              disabled={meta.current_page === meta.last_page || isLoading}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-r-md transition-all duration-200 ${
                meta.current_page === meta.last_page || isLoading ? btnDisabled : btnActive
              }`}
            >
              »»
            </button>
          </nav>

          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size-unified" className="text-sm font-medium text-gray-700">
                Mostrar:
              </label>
              <select
                id="page-size-unified"
                value={meta.per_page}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                disabled={isLoading}
                className="block w-auto rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">por página</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
