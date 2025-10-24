'use client';

import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useUser } from '@/lib/stores/authStore';

export default function UnauthorizedPage() {
  const router = useRouter();
  const user = useUser();
  const getYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="card p-8">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-dark mb-4">
            Acceso Denegado
          </h1>

          {/* Description */}
          <p className="text-muted mb-6">
            No tienes los permisos necesarios para acceder a esta página.
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Información de tu cuenta:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Usuario:</span> {user.name}</p>
                <p><span className="font-medium">Rol:</span> {user.role}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
              </div>
              
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Tus permisos actuales:</p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.map((permission) => (
                    <span 
                      key={permission}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Si crees que deberías tener acceso a esta página, contacta a tu administrador del sistema.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver Atrás
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center px-4 py-2 btn-primary"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © {getYear} Idea Digitales. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
