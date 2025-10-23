'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useHydration } from '@/lib/hooks/useHydration';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const isHydrated = useHydration();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Solo verificar autenticación una vez después de la hidratación y si no está ya autenticado
    if (isHydrated && !hasChecked.current && !isAuthenticated) {
      console.log('AuthProvider: Inicializando verificación de autenticación');
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth, isHydrated, isAuthenticated]);

  return <>{children}</>;
}
