'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsAuthenticated, useAuthLoading, useUser } from '@/lib/stores/authStore';

interface UseAuthProtectionProps {
  requiredPermissions?: string[];
  fallbackPath?: string;
  permissionMatch?: 'any' | 'all';
}

export function useAuthProtection({ 
  requiredPermissions = [], 
  fallbackPath = '/login',
  permissionMatch = 'all'
}: UseAuthProtectionProps = {}) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const user = useUser();
  const { checkAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const hasCheckedAuth = useRef(!!isAuthenticated);


  // Solo verificar autenticación una vez cuando no estamos autenticados
  useEffect(() => {
    if (!hasCheckedAuth.current && !isAuthenticated && !isLoading) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, isLoading]);

  // Si en algún momento el usuario está autenticado, marcamos como verificado
  useEffect(() => {
    if (isAuthenticated) {
      hasCheckedAuth.current = true;
    }
  }, [isAuthenticated]);

  // Marcar como inicializado después de la primera verificación
  useEffect(() => {
    if (hasCheckedAuth.current && !isLoading) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Redirigir solo si definitivamente no está autenticado
  useEffect(() => {
    if (!isInitializing && !isLoading && !isAuthenticated && hasCheckedAuth.current) {
      const timer = setTimeout(() => {
        router.replace(fallbackPath);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, isInitializing, router, fallbackPath]);

  const shouldBypassPermissions = user?.role === 'admin';

  const evaluatePermissions = () => {
    if (shouldBypassPermissions) return true;
    if (!user || requiredPermissions.length === 0) return true;

    const evaluator = permissionMatch === 'all' ? 'every' : 'some';
    return requiredPermissions[evaluator]((permission) => user.permissions.includes(permission));
  };

  // Verificar permisos si el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && user && requiredPermissions.length > 0 && !shouldBypassPermissions) {
      const hasPermission = evaluatePermissions();

      if (!hasPermission) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, requiredPermissions, router, permissionMatch, shouldBypassPermissions]);

  const hasPermission = evaluatePermissions();

  return {
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    user,
    hasPermission,
    shouldShowContent: isAuthenticated && hasPermission && !isLoading && !isInitializing
  };
}
