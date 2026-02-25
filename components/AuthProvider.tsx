'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useHydration } from '@/lib/hooks/useHydration';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuthStore();
  const isHydrated = useHydration();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Verificar siempre al montar; checkAuth() usa caché de 5 min para no generar llamadas extra
    if (isHydrated && !hasChecked.current) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth, isHydrated]);

  return <>{children}</>;
}
