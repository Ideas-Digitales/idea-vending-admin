'use client';

import { useEffect, useState } from 'react';
import { Loader2, Monitor, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createMachineAction } from '@/lib/actions/machines';
import { notify } from '@/lib/adapters/notification.adapter';
import type { CreateMachineFormData } from '@/lib/schemas/machine.schema';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const MACHINE_TYPES: CreateMachineFormData['type'][] = ['MDB', 'MDB-DEX', 'PULSES'];

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-blue-600/80">
      <Info className="h-3.5 w-3.5 mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function CreateMaquinaModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<CreateMachineFormData['type']>('MDB');
  const [enterpriseId, setEnterpriseId] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setLocation('');
      setType('MDB');
      setEnterpriseId(0);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !enterpriseId) return;
    setSaving(true);
    try {
      const result = await createMachineAction({
        name: name.trim(),
        location: location.trim(),
        type,
        enterprise_id: enterpriseId,
        client_id: null,
      });
      if (!result.success) {
        notify.error(result.error ?? 'Error al crear máquina');
        return;
      }
      notify.success('Máquina creada exitosamente');
      onCreated();
      onOpenChange(false);
    } catch {
      notify.error('Error al crear máquina');
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
            Nueva Máquina
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
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
              Nombre único e identificable. Incluye referencia al lugar y número si hay varias. Ej: <strong>«Snacks Casino Norte»</strong> o <strong>«VM-Torre B P3»</strong>. Evita nombres genéricos como «Máquina 1».
            </FieldHint>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
            <textarea
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input-field"
              placeholder="Ej: Edificio Central, Piso 2, frente a los ascensores"
              rows={2}
              required
              disabled={saving}
            />
            <FieldHint>
              Sé específico: edificio, piso, sala o punto de referencia. Aparece en reposición y etiquetas QR. Ej: <strong>«Av. Providencia 1234, Casino Piso 1, junto a cajas»</strong>.
            </FieldHint>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CreateMachineFormData['type'])}
                className="input-field"
                required
                disabled={saving}
              >
                {MACHINE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <FieldHint>
                <strong>MDB</strong>: estándar para máquinas modernas. <strong>MDB-DEX</strong>: MDB con auditoría detallada de ventas. <strong>PULSES</strong>: máquinas antiguas con señales de pulso. Consulta el manual de tu equipo si no estás seguro.
              </FieldHint>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
              <EnterpriseSearchInput
                selectedEnterpriseId={enterpriseId || null}
                onEnterpriseSelect={(enterprise) => setEnterpriseId(enterprise?.id ?? 0)}
                disabled={saving}
                placeholder="Buscar empresa por nombre o RUT..."
              />
              <FieldHint>
                Define qué productos y usuarios tendrán acceso a gestionar esta máquina.
              </FieldHint>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              disabled={saving || !name.trim() || !location.trim() || !enterpriseId}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Máquina'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
