'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createProductAction } from '@/lib/actions/products';
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import { useMqttProduct } from '@/lib/hooks/useMqttProduct';
import { notify } from '@/lib/adapters/notification.adapter';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateProductoModal({ open, onOpenChange, onCreated }: Props) {
  const { publishProductOperation, isPublishing } = useMqttProduct();
  const [name, setName] = useState('');
  const [enterpriseId, setEnterpriseId] = useState(0);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setEnterpriseId(0);
      return;
    }
    setLoadingEnterprises(true);
    getEnterprisesAction({ limit: 100 })
      .then(res => { if (res.success) setEnterprises(res.enterprises ?? []); })
      .finally(() => setLoadingEnterprises(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !enterpriseId) return;
    setSaving(true);
    try {
      const result = await createProductAction({ name: name.trim(), enterprise_id: enterpriseId });
      if (!result.success || !result.product) {
        notify.error(`Error al crear producto: ${result.error ?? 'Error desconocido'}`);
        return;
      }
      try {
        await publishProductOperation('create', result.product);
      } catch {
        // MQTT falla silenciosamente
      }
      notify.success('Producto creado exitosamente');
      onCreated();
      onOpenChange(false);
    } catch {
      notify.error('Error al crear producto');
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || isPublishing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Nuevo Producto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="Ej: Coca Cola 350ml"
              required
              autoFocus
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa *
            </label>
            {loadingEnterprises ? (
              <div className="input-field flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando empresas...
              </div>
            ) : (
              <select
                value={enterpriseId}
                onChange={e => setEnterpriseId(Number(e.target.value))}
                className="input-field"
                required
                disabled={busy}
              >
                <option value={0}>Seleccionar empresa</option>
                {enterprises.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary" disabled={busy || !name.trim() || !enterpriseId}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isPublishing ? 'Sincronizando...' : 'Creando...'}
                </>
              ) : (
                'Crear Producto'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
