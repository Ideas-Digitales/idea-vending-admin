'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsAuthenticated, useAuthLoading, useUser } from '@/lib/stores/authStore';

interface UseAuthProtectionProps {
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function useAuthProtection({ 
  requiredPermissions = [], 
  fallbackPath = '/login' 
}: UseAuthProtectionProps = {}) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const user = useUser();
  const { checkAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const hasCheckedAuth = useRef(false);


  // Solo verificar autenticación una vez al montar el componente
  useEffect(() => {
    if (!hasCheckedAuth.current && !isAuthenticated && !isLoading) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, []); // Sin dependencias para que solo se ejecute una vez

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

  // Verificar permisos si el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && user && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(permission => 
        user.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, requiredPermissions, router]);

  const hasPermission = () => {
    if (!user || requiredPermissions.length === 0) return true;
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  };

  return {
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    user,
    hasPermission: hasPermission(),
    shouldShowContent: isAuthenticated && hasPermission() && !isLoading && !isInitializing
  };
}
