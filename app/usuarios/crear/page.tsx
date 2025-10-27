"use client";

import { useState } from "react";
import CreateUserForm from "@/components/forms/CreateUserForm";
import { CreateUserFormData, EditUserFormData } from "@/lib/schemas/user.schema";
import { createUserAction } from "@/lib/actions/users";
import { useUserStore } from "@/lib/stores/userStore";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
import { notify } from '@/lib/adapters/notification.adapter';

export default function CrearUsuarioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUsers } = useUserStore();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      // En modo crear, los datos vienen del createUserSchema
      const result = await createUserAction(data);

      if (result.success) {
        notify.success('Usuario creado exitosamente');
        await refreshUsers();
        // Forzar recarga completa de la página de usuarios
        window.location.href = '/usuarios';
      } else {
        notify.error(`Error al crear usuario: ${result.error}`);
      }
    } catch (error) {
      notify.error(
        "Error inesperado al crear usuario. Por favor, intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CreateUserForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
