'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Save, X, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { updateEnterpriseSchema, type UpdateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';

export default function EditEnterprisePage() {
  const router = useRouter();
  const params = useParams();
  const enterpriseId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    selectedEnterprise: enterprise,
    isLoadingEnterprise: isLoading,
    enterpriseError: error,
    fetchEnterprise,
    updateEnterprise,
    clearSelectedEnterprise
  } = useEnterpriseStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    getValues,
  } = useForm<UpdateEnterpriseFormData>({
    resolver: zodResolver(updateEnterpriseSchema),
    mode: 'onChange',
  });

  // Cargar empresa al montar el componente
  useEffect(() => {
    if (enterpriseId) {
      fetchEnterprise(enterpriseId);
    }
    
    // Limpiar al desmontar
    return () => {
      clearSelectedEnterprise();
    };
  }, [enterpriseId, fetchEnterprise, clearSelectedEnterprise]);

  // Llenar el formulario cuando se carga la empresa
  useEffect(() => {
    if (enterprise) {
      reset({
        name: enterprise.name,
        rut: enterprise.rut,
        address: enterprise.address,
        phone: enterprise.phone,
      });
    }
  }, [enterprise, reset]);

  const handleBack = () => {
    router.push('/empresas');
  };

  const handleViewDetails = () => {
    router.push(`/empresas/${enterpriseId}`);
  };

  const onSubmit = async (data: UpdateEnterpriseFormData) => {
    // Mostrar mensaje de funcionalidad no implementada
    alert('⚠️ Funcionalidad no implementada\n\nLa edición de empresas aún no está disponible en la API.');
  };

  const handleReset = () => {
    if (enterprise) {
      reset({
        name: enterprise.name,
        rut: enterprise.rut,
        address: enterprise.address,
        phone: enterprise.phone,
      });
    }
  };

  // Estados de carga y error
  if (isLoading || (!enterprise && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted">Cargando empresa...</p>
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
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar empresa</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a empresas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Empresa no encontrada</h3>
            <p className="text-muted mb-4">La empresa que buscas no existe o no tienes permisos para verla.</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a empresas
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  <h1 className="text-2xl font-bold text-dark">Editar Empresa</h1>
                  <p className="text-muted">{enterprise.name}</p>
                </div>
              </div>
              <button
                onClick={handleViewDetails}
                className="btn-secondary"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            {/* Banner de funcionalidad no implementada */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Funcionalidad en desarrollo
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    La edición de empresas aún no está disponible. El endpoint de actualización no ha sido implementado en la API.
                  </div>
                </div>
              </div>
            </div>

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
                  <span>Restablecer</span>
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Guardar Cambios</span>
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
