'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Monitor, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getMachineAction, updateMachineAction } from '@/lib/actions/machines';
import { notify } from '@/lib/adapters/notification.adapter';
import { uploadMachineImage } from '@/lib/utils/imageUpload';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number | string | null;
  onSaved: () => void;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-blue-600/80">
      <Info className="h-3.5 w-3.5 mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function EditMaquinaModal({ open, onOpenChange, machineId, onSaved }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manageStock, setManageStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !machineId) return;
    setLoading(true);
    setName('');
    setLocation('');
    setImageFile(null);
    setImagePreview(null);
    setManageStock(true);
    getMachineAction(machineId)
      .then(res => {
        if (res.success && res.machine) {
          setName(res.machine.name);
          setLocation(res.machine.location);
          setImagePreview(res.machine.image ?? null);
          setManageStock(res.machine.manage_stock ?? true);
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
      const result = await updateMachineAction(machineId, {
        name: name.trim(),
        location: location.trim(),
        manage_stock: manageStock,
      });
      if (!result.success) {
        notify.error(`Error al actualizar: ${result.error}`);
        return;
      }
      if (imageFile) {
        await uploadMachineImage(machineId, imageFile);
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

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Máquina *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Ej: VM-Edificio Central Piso 2"
                required
                autoFocus
                disabled={saving}
              />
              <FieldHint>
                Nombre único e identificable. Incluye referencia al lugar y número si hay varias. Ej: <strong>«Snacks Casino Norte»</strong> o <strong>«VM-Torre B P3»</strong>.
              </FieldHint>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen referencial</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                  setImagePreview(file ? URL.createObjectURL(file) : imagePreview);
                }}
                className="input-field"
                disabled={saving}
              />
              <FieldHint>
                Sube una imagen de referencia para identificar visualmente la máquina.
              </FieldHint>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Vista previa de máquina"
                  className="mt-3 h-32 w-full rounded-xl border border-gray-200 object-cover"
                />
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3">
                <input
                  type="checkbox"
                  checked={manageStock}
                  onChange={e => setManageStock(e.target.checked)}
                  disabled={saving}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-700">Controlar stock de esta máquina</span>
                  <span className="block mt-1 text-xs text-gray-500">
                    Si lo desactivas, los slots heredados dejan de participar en alertas y reposición.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
              <textarea
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input-field"
                placeholder="Ej: Edificio Central, Piso 2, frente a los ascensores"
                rows={3}
                required
                disabled={saving}
              />
              <FieldHint>
                Sé específico: edificio, piso, sala o punto de referencia. Aparece en reposición y etiquetas QR. Ej: <strong>«Av. Providencia 1234, Casino Piso 1, junto a cajas»</strong>.
              </FieldHint>
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
