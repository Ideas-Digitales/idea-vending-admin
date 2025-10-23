'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProductsAction, type Producto, type ProductsFilters, type ProductsResponse } from '@/lib/actions/products';

interface UseInfiniteScrollProductsOptions {
  initialProducts?: Producto[];
  initialPagination?: ProductsResponse['pagination'];
  filters?: ProductsFilters;
}

interface UseInfiniteScrollProductsReturn {
  products: Producto[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: (newFilters?: ProductsFilters) => void;
  totalCount: number;
}

export function useInfiniteScrollProducts({
  initialProducts = [],
  initialPagination,
  filters = {}
}: UseInfiniteScrollProductsOptions): UseInfiniteScrollProductsReturn {
  const [products, setProducts] = useState<Producto[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination?.meta.current_page || 1);
  const [hasMore, setHasMore] = useState(
    initialPagination ? initialPagination.meta.current_page < initialPagination.meta.last_page : true
  );
  const [totalCount, setTotalCount] = useState(initialPagination?.meta.total || 0);
  
  // Ref para evitar llamadas duplicadas
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);

  // Actualizar filtros cuando cambien
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loading) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const response = await getProductsAction({
        ...filtersRef.current,
        page: nextPage,
      });

      if (response.success && response.products) {
        setProducts(prevProducts => [...prevProducts, ...response.products!]);
        setCurrentPage(nextPage);
        
        if (response.pagination) {
          setHasMore(nextPage < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
        }
      } else {
        setError(response.error || 'Error al cargar más productos');
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, hasMore, loading]);

  const refresh = useCallback(async (newFilters?: ProductsFilters) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filtersRef.current;
      const response = await getProductsAction({
        ...filtersToUse,
        page: 1,
      });

      if (response.success && response.products) {
        setProducts(response.products);
        setCurrentPage(1);
        
        if (response.pagination) {
          setHasMore(1 < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
          setTotalCount(response.products.length);
        }
      } else {
        setError(response.error || 'Error al cargar productos');
        setProducts([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setProducts([]);
      setHasMore(false);
      setTotalCount(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  return {
    products,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
  };
}
