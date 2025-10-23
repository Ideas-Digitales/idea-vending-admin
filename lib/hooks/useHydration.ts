'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para manejar la hidratación y evitar errores de mismatch
 * entre servidor y cliente
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook para usar stores de Zustand de forma segura durante la hidratación
 */
export function useHydratedStore<T>(
  store: () => T,
  fallback: T
): T {
  const isHydrated = useHydration();
  const storeValue = store();
  
  return isHydrated ? storeValue : fallback;
}
