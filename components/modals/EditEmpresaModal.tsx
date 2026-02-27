'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getEnterpriseAction, updateEnterpriseAction } from '@/lib/actions/enterprise';
import { updateEnterpriseSchema, type UpdateEnterpriseFormData } from '@/lib/schemas/enterprise.schema';
import { notify } from '@/lib/adapters/notification.adapter';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterpriseId: number | string | null;
  onSaved: () => void;
}

export function EditEmpresaModal({ open, onOpenChange, enterpriseId, onSaved }: Props) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<UpdateEnterpriseFormData>({
    resolver: zodResolver(updateEnterpriseSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open || !enterpriseId) return;
    setLoading(true);
    setEnterprise(null);
    getEnterpriseAction(enterpriseId)
      .then(res => {
        if (res.success && res.enterprise) {
          setEnterprise(res.enterprise);
          reset({
            name: res.enterprise.name,
            phone: res.enterprise.phone,
            address: res.enterprise.address,
          });
        } else {
          notify.error('No se pudo cargar la empresa');
          onOpenChange(false);
        }
      })
      .finally(() => setLoading(false));
  }, [open, enterpriseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: UpdateEnterpriseFormData) => {
    if (!enterpriseId) return;
    setSaving(true);
    try {
      const result = await updateEnterpriseAction(enterpriseId, data);
      if (!result.success) {
        notify.error(`Error al actualizar: ${result.error}`);
        return;
      }
      notify.success('Empresa actualizada exitosamente');
      onSaved();
      onOpenChange(false);
    } catch {
      notify.error('Error inesperado al actualizar empresa');
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
            Editar Empresa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
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
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                <input
                  type="text"
                  value={enterprise?.rut ?? ''}
                  className="input-field bg-gray-50 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-400">No modificable</p>
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

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={!isValid || !isDirty || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
