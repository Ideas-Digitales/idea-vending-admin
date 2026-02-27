'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Monitor } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getMachineAction, updateMachineAction } from '@/lib/actions/machines';
import { notify } from '@/lib/adapters/notification.adapter';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number | string | null;
  onSaved: () => void;
}

export function EditMaquinaModal({ open, onOpenChange, machineId, onSaved }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !machineId) return;
    setLoading(true);
    setName('');
    setLocation('');
    getMachineAction(machineId)
      .then(res => {
        if (res.success && res.machine) {
          setName(res.machine.name);
          setLocation(res.machine.location);
        } else {
          notify.error('No se pudo cargar la máquina');
          onOpenChange(false);
        }
      })
      .finally(() => setLoading(false));
  }, [open, machineId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !name.trim() || !location.trim()) return;
    setSaving(true);
    try {
      const result = await updateMachineAction(machineId, { name: name.trim(), location: location.trim() });
      if (!result.success) {
        notify.error(`Error al actualizar: ${result.error}`);
        return;
      }
      notify.success('Máquina actualizada exitosamente');
      onSaved();
      onOpenChange(false);
    } catch {
      notify.error('Error al actualizar máquina');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Editar Máquina
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Máquina *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Ej: Mall Central"
                required
                autoFocus
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación *
              </label>
              <textarea
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input-field"
                placeholder="Ej: Mall Central, Local 23"
                rows={3}
                required
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={saving || !name.trim() || !location.trim()}>
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
