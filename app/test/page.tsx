'use client';

import { CheckCircle, User, Shield, Clock } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function TestContent() {
  const user = useUser();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Página de Prueba</h1>
                <p className="text-muted">Verificación del sistema y autenticación</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* User Info Card */}
            <div className="card p-8 mb-8">
              <h2 className="text-xl font-bold text-dark mb-6 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Usuario
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Nombre</label>
                  <p className="text-dark font-medium">{user?.name || 'No disponible'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Email</label>
                  <p className="text-dark font-medium">{user?.email || 'No disponible'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Rol</label>
                  <span className="badge badge-info">{user?.role || 'No disponible'}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">ID</label>
                  <p className="text-dark font-medium font-mono text-sm">{user?.id || 'No disponible'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-semibold text-muted mb-2">Permisos</label>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions?.map((permission) => (
                    <span key={permission} className="badge badge-success">
                      {permission}
                    </span>
                  )) || <span className="text-muted">No hay permisos disponibles</span>}
                </div>
              </div>
              
              {user?.lastLogin && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-muted mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Último Acceso
                  </label>
                  <p className="text-dark font-medium">
                    {new Date(user.lastLogin).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="card p-8 mb-8">
              <h2 className="text-xl font-bold text-dark mb-6 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Estado de Seguridad
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Autenticación Válida</span>
                  </div>
                  <span className="badge badge-success">Activo</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Sesión Segura</span>
                  </div>
                  <span className="badge badge-info">Protegida</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Permisos Verificados</span>
                  </div>
                  <span className="badge" style={{ backgroundColor: '#e6ebf7', color: '#1e3a7a' }}>
                    {user?.permissions?.length || 0} permisos
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-dark mb-6">Enlaces de Navegación</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="/dashboard" 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-dark">Dashboard Principal</span>
                  <span className="text-primary">→</span>
                </a>
                
                <a 
                  href="/productos" 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-dark">Gestión de Productos</span>
                  <span className="text-primary">→</span>
                </a>
                
                {user?.permissions?.includes('manage_machines') && (
                  <a 
                    href="/maquinas" 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-dark">Monitoreo de Máquinas</span>
                    <span className="text-primary">→</span>
                  </a>
                )}
                
                {user?.permissions?.includes('view_reports') && (
                  <a 
                    href="/reportes" 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-dark">Reportes y Analytics</span>
                    <span className="text-primary">→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <PageWrapper>
      <TestContent />
    </PageWrapper>
  );
}
