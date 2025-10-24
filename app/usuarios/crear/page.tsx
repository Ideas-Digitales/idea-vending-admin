'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateUserForm from '@/components/forms/CreateUserForm';
import { CreateUserFormData } from '@/lib/schemas/user.schema';
import { createUserAction } from '@/lib/actions/users';
import { useUserStore } from '@/lib/stores/userStore';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft } from 'lucide-react';

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUsers } = useUserStore();

  const handleSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    
    try {
      console.log('Enviando datos del formulario:', { ...data, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
      
      // Llamar a la server action para crear el usuario
      const result = await createUserAction(data);
      
      if (result.success) {
        console.log('Usuario creado exitosamente:', result.user);
        
        // Refrescar los datos del store antes de redirigir
        await refreshUsers();
        
        // Redirigir a la lista de usuarios después de crear
        router.push('/usuarios');
      } else {
        console.error('Error al crear usuario:', result.error);
        // Aquí podrías mostrar un mensaje de error usando un toast o modal
        alert(`Error al crear usuario: ${result.error}`);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al crear usuario. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/usuarios');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/usuarios')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Volver a Usuarios</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CreateUserForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
