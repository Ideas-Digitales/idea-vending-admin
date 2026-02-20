'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Save, CheckCircle, X } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/ui-custom';
import UserSearchInput from '@/components/UserSearchInput';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { createEnterpriseSchema, type CreateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';
import type { User } from '@/lib/interfaces/user.interface';

export default function CreateEnterprisePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const success = await createEnterprise(data);

      if (success) {
        setSuccessMessage('¡Empresa creada exitosamente!');
        reset();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: User | null) => {
    if (user) {
      setValue('user_id', user.id, { shouldValidate: true });
    } else {
      setValue('user_id', 0, { shouldValidate: true });
    }
  };

  return (
    <AppShell>
      <PageHeader
        icon={Building2}
        title="Nueva Empresa"
        subtitle="Crear una nueva empresa en el sistema"
        backHref="/empresas"
        variant="white"
      />

      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700 flex-1">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {updateError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <X className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{updateError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Información Básica */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-dark mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Información de la Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre *
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
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* RUT */}
                <div>
                  <label htmlFor="rut" className="block text-xs font-medium text-gray-600 mb-1">
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
                    <p className="mt-1 text-xs text-red-600">{errors.rut.message}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-gray-600 mb-1">
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
                    <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-xs font-medium text-gray-600 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    {...register('address')}
                    className={`input-field ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Ej: Av. Providencia 1234, Santiago"
                    disabled={isSubmitting}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
                  )}
                </div>

                {/* User Search */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Usuario Propietario *
                  </label>
                  <UserSearchInput
                    selectedUserId={watchedUserId}
                    onUserSelect={handleUserSelect}
                    error={errors.user_id?.message}
                    disabled={isSubmitting}
                    placeholder="Buscar usuario por nombre o email..."
                  />
                </div>
              </div>

              {/* Botón dentro del card para no crear conflicto de stacking context con el dropdown */}
              <div className="flex items-center justify-end pt-4 mt-2 border-t border-gray-100">
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
    </AppShell>
  );
}
