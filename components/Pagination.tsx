"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type PaginationMeta } from "@/lib/interfaces";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  meta,
  onPageChange,
  className = "",
}: PaginationProps) {
  const { current_page, last_page, from, to, total } = meta;

  // Generar array de páginas a mostrar
  const getVisiblePages = () => {
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const range = [];
    const rangeWithDots = [];

    // Calcular el rango de páginas a mostrar
    for (
      let i = Math.max(2, current_page - delta);
      i <= Math.min(last_page - 1, current_page + delta);
      i++
    ) {
      range.push(i);
    }

    // Agregar primera página
    if (current_page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    // Agregar páginas del rango
    rangeWithDots.push(...range);

    // Agregar última página
    if (current_page + delta < last_page - 1) {
      rangeWithDots.push("...", last_page);
    } else if (last_page > 1) {
      rangeWithDots.push(last_page);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  if (last_page <= 1) {
    return null; // No mostrar paginación si solo hay una página
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Información de resultados */}
      <div className="text-sm text-muted">
        Mostrando <span className="font-medium text-dark">{from}</span> a{" "}
        <span className="font-medium text-dark">{to}</span> de{" "}
        <span className="font-medium text-dark">{total}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-2">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-md
            ${
              current_page === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:text-primary hover:bg-gray-50"
            }
          `}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === current_page;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md min-w-[40px]
                  ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  }
                `}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-md
            ${
              current_page === last_page
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:text-primary hover:bg-gray-50"
            }
          `}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

// Componente simplificado para casos donde solo necesitas los botones básicos
export function SimplePagination({
  meta,
  onPageChange,
  className = "",
}: PaginationProps) {
  const { current_page, last_page } = meta;

  if (last_page <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      <button
        onClick={() => onPageChange(current_page - 1)}
        disabled={current_page === 1}
        className={`
          flex items-center px-4 py-2 text-sm font-medium rounded-md border
          ${
            current_page === 1
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
          }
        `}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Anterior
      </button>

      <span className="text-sm text-muted">
        Página {current_page} de {last_page}
      </span>

      <button
        onClick={() => onPageChange(current_page + 1)}
        disabled={current_page === last_page}
        className={`
          flex items-center px-4 py-2 text-sm font-medium rounded-md border
          ${
            current_page === last_page
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
          }
        `}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
}
