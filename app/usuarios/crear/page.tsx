"use client";

import { useState } from "react";
import CreateUserForm from "@/components/forms/CreateUserForm";
import { CreateUserFormData } from "@/lib/schemas/user.schema";
import { createUserAction } from "@/lib/actions/users";
import { useUserStore } from '@/lib/stores/userStore';
import { Users, CheckCircle, XCircle } from "lucide-react";
import { notify } from '@/lib/adapters/notification.adapter';
import { AppShell, PageHeader } from '@/components/ui-custom';
import { useRouter } from 'next/navigation';

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshUsers } = useUserStore();

  const handleSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await createUserAction(data);

      if (result.success) {
        const userName = result.user?.name || data.name || 'Usuario';
        const userStatus = data.status === 'active' ? 'activo' : 'inactivo';
        const successMsg = `Usuario "${userName}" creado exitosamente como ${userStatus}`;

        setSuccessMessage(successMsg);
        notify.success(`✅ ${successMsg}`);

        await refreshUsers();

        setTimeout(() => {
          router.push('/usuarios');
        }, 2000);
      } else {
        const errorMsg = result.error || 'Error desconocido al crear usuario';
        setErrorMessage(errorMsg);
        notify.error(`❌ Error al crear usuario: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error inesperado al crear usuario:', error);
      const errorMsg = "Error inesperado al crear usuario. Por favor, verifica los datos e intenta nuevamente.";
      setErrorMessage(errorMsg);
      notify.error(`❌ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        icon={Users}
        title="Crear Usuario"
        subtitle="Registra un nuevo usuario en el sistema"
        backHref="/usuarios"
        variant="white"
      />

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800">¡Éxito!</h3>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  <p className="text-xs text-green-600 mt-2">Redirigiendo a la lista de usuarios...</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <CreateUserForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </AppShell>
  );
}
