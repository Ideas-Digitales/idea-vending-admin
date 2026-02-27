'use client';

import { useEffect } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserSearchInput from '@/components/UserSearchInput';
import { createEnterpriseAction } from '@/lib/actions/enterprise';
import { createEnterpriseSchema, type CreateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';
import { notify } from '@/lib/adapters/notification.adapter';
import { useState } from 'react';
import type { User } from '@/lib/interfaces/user.interface';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateEmpresaModal({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleUserSelect = (user: User | null) => {
    setValue('user_id', user ? user.id : 0, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setSaving(true);
    try {
      const result = await createEnterpriseAction(data);
      if (!result.success) {
        notify.error(`Error al crear empresa: ${result.error ?? 'Error desconocido'}`);
        return;
      }
      notify.success('Empresa creada exitosamente');
      onCreated();
      onOpenChange(false);
    } catch {
      notify.error('Error inesperado al crear empresa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nueva Empresa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              {...register('name')}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Ej: Ideas Digitales SpA"
              autoFocus
              disabled={saving}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT *
              </label>
              <input
                type="text"
                {...register('rut')}
                className={`input-field ${errors.rut ? 'border-red-500' : ''}`}
                placeholder="76123456-7"
                disabled={saving}
              />
              {errors.rut && <p className="mt-1 text-sm text-red-600">{errors.rut.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+56 9 1234 5678"
                disabled={saving}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <textarea
              rows={2}
              {...register('address')}
              className={`input-field ${errors.address ? 'border-red-500' : ''}`}
              placeholder="Ej: Av. Providencia 1234, Santiago"
              disabled={saving}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario Propietario *
            </label>
            <UserSearchInput
              selectedUserId={watchedUserId}
              onUserSelect={handleUserSelect}
              error={errors.user_id?.message}
              disabled={saving}
              placeholder="Buscar usuario por nombre o email..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary" disabled={!isValid || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Empresa'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
