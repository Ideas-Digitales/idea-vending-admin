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

  // Si ya está autenticado al montar, no necesitamos inicializar
  const [isInitializing, setIsInitializing] = useState(!isAuthenticated);
  const hasCheckedAuth = useRef(!!isAuthenticated);
  // Evitar doble redirect: el Sidebar navega explícitamente; este hook
  // solo redirige en caso de sesión expirada (no en logout intencional)
  const hasRedirected = useRef(false);

  // Verificar auth solo cuando no está autenticado y no se ha chequeado aún
  useEffect(() => {
    if (!hasCheckedAuth.current && !isAuthenticated && !isLoading) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, isLoading]);

  // Cuando el usuario se autentica, marcar como verificado
  useEffect(() => {
    if (isAuthenticated) {
      hasCheckedAuth.current = true;
      hasRedirected.current = false; // reset para próxima vez que deje de estar autenticado
    }
  }, [isAuthenticated]);

  // Marcar como inicializado después de la verificación
  useEffect(() => {
    if (hasCheckedAuth.current && !isLoading) {
      setIsInitializing(false);
    }
  }, [isLoading]);

  // Sesión expirada: redirigir solo si no es un logout intencional
  // (el logout intencional usa router.push desde el Sidebar)
  const needsRedirect = hasCheckedAuth.current && !isAuthenticated && !isLoading && !isInitializing;

  useEffect(() => {
    if (needsRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      // Pequeño delay para ceder prioridad al router.push del Sidebar si está en progreso
      const timer = setTimeout(() => {
        router.replace(fallbackPath);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [needsRedirect, router, fallbackPath]);

  const shouldBypassPermissions = user?.role === 'admin';

  const evaluatePermissions = () => {
    if (shouldBypassPermissions) return true;
    if (!user || requiredPermissions.length === 0) return true;
    const evaluator = permissionMatch === 'all' ? 'every' : 'some';
    return requiredPermissions[evaluator]((permission) => user.permissions.includes(permission));
  };

  // Verificar permisos
  useEffect(() => {
    if (isAuthenticated && user && requiredPermissions.length > 0 && !shouldBypassPermissions) {
      if (!evaluatePermissions()) {
        router.push('/unauthorized');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, requiredPermissions, router, permissionMatch, shouldBypassPermissions]);

  const hasPermission = evaluatePermissions();

  // Mostrar spinner mientras: carga, inicializa, o espera el redirect de sesión expirada
  const effectiveLoading = isLoading || isInitializing || needsRedirect;

  return {
    isAuthenticated,
    isLoading: effectiveLoading,
    user,
    hasPermission,
    shouldShowContent: isAuthenticated && hasPermission && !isLoading && !isInitializing,
  };
}
