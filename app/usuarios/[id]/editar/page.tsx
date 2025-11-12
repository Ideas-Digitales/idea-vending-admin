"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CreateUserForm from "@/components/forms/CreateUserForm";
import { EditUserFormData } from "@/lib/schemas/user.schema";
import { updateUserAction } from "@/lib/actions/users";
import { useUserStore } from "@/lib/stores/userStore";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, User } from "lucide-react";
import { notify } from '@/lib/adapters/notification.adapter';

export default function EditarUsuarioPage() {
  const params = useParams();
  const userId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  
  const { 
    selectedUser: user,
    isLoadingUser,
    userError,
    fetchUser,
    refreshUsers,
    clearSelectedUser,
    clearUserError
  } = useUserStore();

  // Cargar usuario al montar el componente
  useEffect(() => {
    if (userId) {
      clearSelectedUser();
      clearUserError();
      fetchUser(userId);
    }
  }, [userId, fetchUser, clearSelectedUser, clearUserError]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearSelectedUser();
      clearUserError();
    };
  }, [clearSelectedUser, clearUserError]);

  // Controlar cuándo mostrar "no encontrado" con delay
  useEffect(() => {
    if (!isLoadingUser && !user && !userError) {
      const timer = setTimeout(() => {
        setShowNotFound(true);
      }, 1000); // Esperar 1 segundo antes de mostrar "no encontrado"
      
      return () => clearTimeout(timer);
    } else {
      setShowNotFound(false);
    }
  }, [isLoadingUser, user, userError]);

  const handleSubmit = async (data: any) => {
    if (!userId) return;
    
    setIsLoading(true);

    try {
      const result = await updateUserAction(userId, data);

      if (result.success) {
        notify.success('Usuario actualizado exitosamente');
        // Recargar los datos del usuario para mostrar los cambios actualizados
        await fetchUser(userId);
        await refreshUsers();
      } else {
        notify.error(`Error al actualizar usuario: ${result.error}`);
      }
    } catch (error) {
      notify.error(
        "Error inesperado al actualizar usuario. Por favor, intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingUser) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => window.location.href = '/usuarios'}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Volver a Usuarios</span>
                  </button>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Editar Usuario</h1>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-600" />
                    <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                </div>

                {/* Skeleton form */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-6">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map((i) => (
                        <div key={i}>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar usuario</h3>
            <p className="text-muted mb-4">{userError}</p>
            <button 
              onClick={() => window.location.href = '/usuarios'} 
              className="btn-primary"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User not found (only show after delay)
  if (showNotFound) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Usuario no encontrado</h3>
            <p className="text-muted mb-4">El usuario solicitado no existe o no tienes permisos para editarlo.</p>
            <button 
              onClick={() => window.location.href = '/usuarios'} 
              className="btn-primary"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we reach here, user should exist, but add safety check
  if (!user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos del usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.href = '/usuarios'}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Volver a Usuarios</span>
                </button>
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Editar Usuario</h1>
                  <p className="text-sm text-gray-600">{user.name}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CreateUserForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              mode="edit"
              initialData={user}
              title={`Editar Usuario: ${user.name}`}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
