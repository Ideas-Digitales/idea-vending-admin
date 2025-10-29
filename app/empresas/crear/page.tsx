'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Save, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { createEnterpriseSchema, type CreateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';

export default function CreateEnterprisePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createEnterprise } = useEnterpriseStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseSchema),
    mode: 'onChange',
  });

  const handleBack = () => {
    router.push('/empresas');
  };

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setIsSubmitting(true);
    
    try {
      const success = await createEnterprise(data);
      
      if (success) {
        // Mostrar mensaje de éxito y redirigir
        router.push('/empresas');
      } else {
        // El error ya se maneja en el store
        console.error('Error al crear la empresa');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
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
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Nueva Empresa</h1>
                  <p className="text-muted">Crear una nueva empresa en el sistema</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Información Básica */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Información de la Empresa
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name')}
                      className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: Ideas Digitales SpA"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* RUT */}
                  <div>
                    <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                      RUT *
                    </label>
                    <input
                      type="text"
                      id="rut"
                      {...register('rut')}
                      className={`input-field ${errors.rut ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: 76123456-7"
                    />
                    {errors.rut && (
                      <p className="mt-1 text-sm text-red-600">{errors.rut.message}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: +56 9 1234 5678"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      {...register('address')}
                      className={`input-field ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: Av. Providencia 1234, Santiago, Santiago"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  {/* User ID */}
                  <div>
                    <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                      ID de Usuario *
                    </label>
                    <input
                      type="number"
                      id="user_id"
                      {...register('user_id', { valueAsNumber: true })}
                      className={`input-field ${errors.user_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: 67"
                      min="1"
                    />
                    {errors.user_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      ID del usuario que será propietario de esta empresa
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  <span>Limpiar</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
