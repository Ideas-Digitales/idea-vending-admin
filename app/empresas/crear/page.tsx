'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Save, X, CheckCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import UserSearchInput from '@/components/UserSearchInput';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { createEnterpriseSchema, type CreateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';
import type { User } from '@/lib/interfaces/user.interface';

export default function CreateEnterprisePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { createEnterprise, updateError } = useEnterpriseStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseSchema),
    mode: 'onChange',
  });

  const watchedUserId = watch('user_id');

  const handleBack = () => {
    router.push('/empresas');
  };

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    
    try {
      const success = await createEnterprise(data);
      
      if (success) {
        setSuccessMessage('¡Empresa creada exitosamente!');
        reset(); // Limpiar formulario
        // Auto-ocultar mensaje después de 5 segundos
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedUser(null);
    setSuccessMessage(null);
  };

  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user);
    if (user) {
      setValue('user_id', user.id, { shouldValidate: true });
    } else {
      setValue('user_id', undefined as any, { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-600 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Nueva Empresa</h1>
                  <p className="text-gray-600">Crear una nueva empresa en el sistema</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Éxito</h3>
                    <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  </div>
                  <button 
                    onClick={() => setSuccessMessage(null)}
                    className="ml-auto text-green-500 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {updateError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{updateError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Información Básica */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Información de la Empresa
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name')}
                      className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: Ideas Digitales SpA"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* RUT */}
                  <div>
                    <label htmlFor="rut" className="block text-sm font-medium text-black mb-2">
                      RUT *
                    </label>
                    <input
                      type="text"
                      id="rut"
                      {...register('rut')}
                      className={`input-field ${errors.rut ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: 76123456-7"
                      disabled={isSubmitting}
                    />
                    {errors.rut && (
                      <p className="mt-1 text-sm text-red-600">{errors.rut.message}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: +56 9 1234 5678"
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-black mb-2">
                      Dirección *
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      {...register('address')}
                      className={`input-field ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: Av. Providencia 1234, Santiago, Santiago"
                      disabled={isSubmitting}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  {/* User Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">
                      Usuario Propietario *
                    </label>
                    <UserSearchInput
                      selectedUserId={watchedUserId}
                      onUserSelect={handleUserSelect}
                      error={errors.user_id?.message}
                      disabled={isSubmitting}
                      placeholder="Buscar usuario por nombre o email..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Selecciona el usuario que será propietario de esta empresa
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  <span>Limpiar</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Crear Empresa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
