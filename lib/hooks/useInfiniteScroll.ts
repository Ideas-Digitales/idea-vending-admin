'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUsersAction, type Usuario, type UsersFilters, type UsersResponse } from '@/lib/actions/users';

interface UseInfiniteScrollOptions {
  initialUsers?: Usuario[];
  initialPagination?: UsersResponse['pagination'];
  filters?: UsersFilters;
}

interface UseInfiniteScrollReturn {
  users: Usuario[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: (newFilters?: UsersFilters) => void;
  totalCount: number;
}

export function useInfiniteScroll({
  initialUsers = [],
  initialPagination,
  filters = {}
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [users, setUsers] = useState<Usuario[]>(initialUsers);
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
      const response = await getUsersAction({
        ...filtersRef.current,
        page: nextPage,
      });

      if (response.success && response.users) {
        setUsers(prevUsers => [...prevUsers, ...response.users!]);
        setCurrentPage(nextPage);
        
        if (response.pagination) {
          setHasMore(nextPage < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
        }
      } else {
        setError(response.error || 'Error al cargar más usuarios');
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

  const refresh = useCallback(async (newFilters?: UsersFilters) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filtersRef.current;
      const response = await getUsersAction({
        ...filtersToUse,
        page: 1,
      });

      if (response.success && response.users) {
        setUsers(response.users);
        setCurrentPage(1);
        
        if (response.pagination) {
          setHasMore(1 < response.pagination.meta.last_page);
          setTotalCount(response.pagination.meta.total);
        } else {
          setHasMore(false);
          setTotalCount(response.users.length);
        }
      } else {
        setError(response.error || 'Error al cargar usuarios');
        setUsers([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setUsers([]);
      setHasMore(false);
      setTotalCount(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  return {
    users,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
  };
}

// Hook para detectar cuando el usuario está cerca del final de la página
export function useScrollToBottom(callback: () => void, threshold = 200) {
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback();
      }
    };

    // Throttle para evitar llamadas excesivas
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [callback, threshold]);
}
