'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Shield, Edit, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useUserStore } from '@/lib/stores/userStore';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  // Store state
  const {
    selectedUser: user,
    isLoadingUser: isLoading,
    userError: error,
    fetchUser,
    clearUserError,
    clearSelectedUser
  } = useUserStore();

  useEffect(() => {
    if (!userId) return;
    
    // Limpiar usuario anterior y errores
    clearSelectedUser();
    clearUserError();
    
    // Cargar usuario usando el store
    fetchUser(userId);
  }, [userId, fetchUser, clearSelectedUser, clearUserError]);

  // Limpiar usuario al desmontar el componente
  useEffect(() => {
    return () => {
      clearSelectedUser();
      clearUserError();
    };
  }, [clearSelectedUser, clearUserError]);

  const handleBack = () => {
    // Limpiar completamente el store antes de navegar
    clearSelectedUser();
    clearUserError();
    
    // Forzar recarga completa de la página de usuarios
    window.location.href = '/usuarios';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles del usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar usuario</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Usuario no encontrado</h3>
            <p className="text-muted mb-4">El usuario solicitado no existe o no tienes permisos para verlo.</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Detalles del Usuario</h1>
                  <p className="text-muted">Información completa y gestión del usuario</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.location.href = `/usuarios/${userId}/editar`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button className="btn-danger flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{user.name}</h2>
                    <p className="text-muted">{user.email}</p>
                  
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Información Personal
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <p className="text-dark">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <p className="text-dark flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <p className="text-dark">{user.rut}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Información de Cuenta
                </h3>
                <div className="space-y-4">
                  {/* Roles del Sistema */}
                  {user.roles && user.roles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Roles del Sistema</label>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empresas Asociadas */}
                  {user.enterprises && user.enterprises.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Empresas Asociadas</label>
                      <div className="flex flex-wrap gap-2">
                        {user.enterprises.map((enterprise, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-800 border border-purple-200">
                            {enterprise.name} <span className="text-xs text-gray-500 ml-1">(ID: {enterprise.id})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Último Acceso</label>
                    <p className="text-dark flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(user.lastLogin).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

            </div>


            {/* Permissions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Permisos del Usuario
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {user.permissions.map((permission: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-dark">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Información de Registro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-dark">{new Date(user.createdAt).toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                  <p className="text-dark">{new Date(user.updatedAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
