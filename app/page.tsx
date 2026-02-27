'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/lib/stores/authStore';
import { useHydration } from '@/lib/hooks/useHydration';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isHydrated = useHydration();

  useEffect(() => {
    // Esperar solo la hidratación de Zustand desde localStorage.
    // No esperar isLoading (validación API), para no quedarse atascado
    // si la API tarda. Cada página protegida valida el token por su cuenta.
    if (!isHydrated) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Mostrar spinner mientras se verifica la autenticación
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    </div>
  );
}
