'use client';

import { useAuthProtection } from '@/lib/hooks/useAuthProtection';

interface PageWrapperProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
  permissionMatch?: 'any' | 'all';
}

export default function PageWrapper({ 
  children, 
  requiredPermissions = [], 
  fallbackPath = '/login',
  permissionMatch = 'all'
}: PageWrapperProps) {
  const { shouldShowContent, isLoading, hasPermission, user } = useAuthProtection({
    requiredPermissions,
    fallbackPath,
    permissionMatch
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  // Mostrar error de permisos si no tiene acceso
  if (!hasPermission && user) {
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
            onClick={() => window.history.back()}
            className="mt-6 btn-primary"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Mostrar contenido si todo está bien
  if (shouldShowContent) {
    return <>{children}</>;
  }

  // Fallback - no debería llegar aquí normalmente
  return null;
}
