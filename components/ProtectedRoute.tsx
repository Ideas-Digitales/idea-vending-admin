'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useIsAuthenticated, useAuthLoading, useUser } from '@/lib/stores/authStore';
import MachinePageSkeleton from './skeletons/MachinePageSkeleton';
import UserPageSkeleton from './skeletons/UserPageSkeleton';
import ProductPageSkeleton from './skeletons/ProductPageSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const user = useUser();
  const { checkAuth } = useAuthStore();

  // Función para obtener el skeleton apropiado según la ruta
  const getPageSkeleton = () => {
    if (pathname.includes('/maquinas')) {
      return <MachinePageSkeleton />;
    }
    if (pathname.includes('/usuarios')) {
      return <UserPageSkeleton />;
    }
    if (pathname.includes('/productos')) {
      return <ProductPageSkeleton />;
    }
    // Skeleton genérico para otras páginas
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Solo verificar autenticación si no está ya autenticado
    if (!isAuthenticated && !isLoading) {
      console.log('ProtectedRoute: Verificando autenticación...');
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, isLoading]);

  useEffect(() => {
    // Redirigir solo si definitivamente no está autenticado
    if (!isLoading && !isAuthenticated) {
      console.log('Usuario no autenticado después de verificación, redirigiendo a:', fallbackPath);
      const timer = setTimeout(() => {
        router.replace(fallbackPath);
      }, 100); // Pequeño delay para evitar redirecciones prematuras
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router, fallbackPath]);

  // Verificar permisos si el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && user && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(permission => 
        user.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        console.log('Usuario sin permisos suficientes, redirigiendo a unauthorized');
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, requiredPermissions, router]);

  // Mostrar skeleton específico de la página mientras se verifica la autenticación
  if (isLoading) {
    return getPageSkeleton();
  }

  // No renderizar hijos si no está autenticado
  if (!isAuthenticated) {
    return null;
  }

  // Verificar permisos
  if (requiredPermissions.length > 0 && user) {
    const hasPermission = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes los permisos necesarios para acceder a esta página.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Permisos requeridos: {requiredPermissions.join(', ')}
              </p>
              <p className="text-sm text-gray-500">
                Tus permisos: {user.permissions.join(', ')}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 btn-primary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
