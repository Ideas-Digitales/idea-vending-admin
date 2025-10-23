'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMachinesAction, type Maquina, type MachinesFilters, type MachinesResponse } from '@/lib/actions/machines';

interface UseInfiniteScrollMachinesOptions {
  initialMachines?: Maquina[];
  initialPagination?: MachinesResponse['pagination'];
  filters?: MachinesFilters;
}

interface UseInfiniteScrollMachinesReturn {
  machines: Maquina[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: (newFilters?: MachinesFilters) => void;
  totalCount: number;
}

export function useInfiniteScrollMachines({
  initialMachines = [],
  initialPagination,
  filters = {}
}: UseInfiniteScrollMachinesOptions): UseInfiniteScrollMachinesReturn {
  const [machines, setMachines] = useState<Maquina[]>(initialMachines);
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
      const response = await getMachinesAction({
        ...filtersRef.current,
        page: nextPage,
      });

      if (response.success && response.machines) {
        setMachines(prevMachines => [...prevMachines, ...response.machines!]);
        setCurrentPage(nextPage);
        
        if (response.pagination) {
          setHasMore(nextPage < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
        }
      } else {
        setError(response.error || 'Error al cargar más máquinas');
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

  const refresh = useCallback(async (newFilters?: MachinesFilters) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filtersRef.current;
      const response = await getMachinesAction({
        ...filtersToUse,
        page: 1,
      });

      if (response.success && response.machines) {
        setMachines(response.machines);
        setCurrentPage(1);
        
        if (response.pagination) {
          setHasMore(1 < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
          setTotalCount(response.machines.length);
        }
      } else {
        setError(response.error || 'Error al cargar máquinas');
        setMachines([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setMachines([]);
      setHasMore(false);
      setTotalCount(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  return {
    machines,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
  };
}
