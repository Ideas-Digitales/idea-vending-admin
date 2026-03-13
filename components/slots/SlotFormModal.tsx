'use client';

import { useState, useEffect } from 'react';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { Slot, CreateSlot, UpdateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { Save, Loader2, XCircle, AlertCircle, Package, Sparkles } from 'lucide-react';

interface SlotFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number;
  slot?: Slot | null;
  products: Producto[];
  isLoadingProducts: boolean;
  onSuccess: () => void;
}

type FormData = {
  mdb_code: number | null;
  label: string;
  product_id: number | null;
  capacity: number | null;
  current_stock: number | null;
};

const EMPTY_FORM: FormData = {
  mdb_code: null,
  label: '',
  product_id: null,
  capacity: null,
  current_stock: null,
};

export default function SlotFormModal({
  open, onOpenChange, machineId, slot, products, isLoadingProducts, onSuccess,
}: SlotFormModalProps) {
  const isEdit = !!slot;

  const { createSlot, updateSlot, isCreating, isUpdating, createError, updateError, clearErrors } = useSlotStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [formData, setFormData]       = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [labelAutoFilled, setLabelAutoFilled] = useState(false);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (!open) return;
    if (slot) {
      setFormData({
        mdb_code: slot.mdb_code,
        label: slot.label || '',
        product_id: slot.product_id,
        capacity: slot.capacity,
        current_stock: slot.current_stock,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
    setLabelAutoFilled(false);
    clearErrors();
  }, [open, slot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    clearErrors();
    const numFields = ['mdb_code', 'capacity', 'current_stock', 'product_id'];
    const parsed = numFields.includes(name) ? (value === '' ? null : Number(value)) : value;

    if (name === 'product_id') {
      const product = products.find(p => String(p.id) === value);
      setFormData(prev => {
        const newLabel = product && (prev.label === '' || labelAutoFilled)
          ? product.name
          : prev.label;
        if (product && (prev.label === '' || labelAutoFilled)) setLabelAutoFilled(true);
        else if (!product) setLabelAutoFilled(false);
        return { ...prev, product_id: parsed as number | null, label: newLabel };
      });
      return;
    }

    if (name === 'label') setLabelAutoFilled(false);

    setFormData(prev => ({ ...prev, [name]: parsed }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (formData.mdb_code == null || formData.mdb_code < 0)
      e.mdb_code = 'Requerido y debe ser ≥ 0';
    if (formData.capacity != null && formData.capacity < 0)
      e.capacity = 'No puede ser negativo';
    if (formData.current_stock != null && formData.current_stock < 0)
      e.current_stock = 'No puede ser negativo';
    if (formData.capacity != null && formData.current_stock != null && formData.current_stock > formData.capacity)
      e.current_stock = 'No puede superar la capacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && slot) {
      const payload: UpdateSlot = {
        mdb_code: formData.mdb_code ?? undefined,
        label: formData.label,
        product_id: formData.product_id,
        capacity: formData.capacity,
        current_stock: formData.current_stock,
      };
      const updated = await updateSlot(machineId, slot.id, payload);
      if (updated) {
        try {
          await publishSlotOperation({
            action: 'update', machineId, slotId: updated.id,
            slotData: { id: updated.id, mdb_code: updated.mdb_code, label: updated.label, product_id: updated.product_id, machine_id: machineId, capacity: updated.capacity, current_stock: updated.current_stock },
          });
        } catch { /* MQTT no crítico */ }
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const payload: CreateSlot = {
        mdb_code: formData.mdb_code ?? 0,
        label: formData.label,
        product_id: formData.product_id,
        capacity: formData.capacity,
        current_stock: formData.current_stock,
      };
      const created = await createSlot(machineId, payload);
      if (created) {
        try {
          await publishSlotOperation({
            action: 'create', machineId, slotId: created.id,
            slotData: { id: created.id, mdb_code: created.mdb_code, label: created.label, product_id: created.product_id, machine_id: machineId, capacity: created.capacity, current_stock: created.current_stock },
          });
        } catch { /* MQTT no crítico */ }
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  const busy      = isCreating || isUpdating || isPublishing;
  const apiError  = isEdit ? updateError : createError;

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? `Editar slot — ${slot?.label || `MDB ${slot?.mdb_code}`}` : 'Nuevo slot'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* API error */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5">
            <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{apiError}</p>
            <button onClick={clearErrors} className="text-red-400 hover:text-red-600">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>

          {/* Producto — primero para poder autorellenar etiqueta */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Producto
              <HelpTooltip className="ml-1.5"
                text="Producto del catálogo que se vende en este slot. Al seleccionarlo se sugiere la etiqueta automáticamente."
                side="top"
              />
            </label>
            {isLoadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-muted py-2.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando productos...
              </div>
            ) : (
              <select
                name="product_id"
                value={formData.product_id ?? ''} onChange={handleChange}
                disabled={busy}
                className="input-field !py-2.5 !text-sm"
              >
                <option value="">Sin producto asignado</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* MDB + Etiqueta — 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Código MDB <span className="text-red-500">*</span>
                <HelpTooltip className="ml-1.5"
                  text="Número que identifica el compartimento en el protocolo MDB. Debe ser único por máquina."
                  side="top"
                />
              </label>
              <input
                type="number" name="mdb_code"
                value={formData.mdb_code ?? ''} onChange={handleChange}
                required min="0" disabled={busy}
                placeholder="Ej: 1, 2, 3…"
                className={`input-field !py-2.5 !text-sm ${errors.mdb_code ? '!border-red-400' : ''}`}
                suppressHydrationWarning
              />
              {errors.mdb_code && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Etiqueta
                <HelpTooltip className="ml-1.5"
                  text="Nombre visible del slot: A1, Fila 2, Snack superior… Si no se define, se usa el código MDB."
                  side="top"
                />
              </label>
              <div className="relative">
                <input
                  type="text" name="label"
                  value={formData.label || ''} onChange={handleChange}
                  disabled={busy} maxLength={50}
                  placeholder="Ej: A1, B2…"
                  className={`input-field !py-2.5 !text-sm ${labelAutoFilled ? '!pr-8 !border-amber-300 !bg-amber-50/40' : ''}`}
                  suppressHydrationWarning
                />
                {labelAutoFilled && (
                  <Sparkles className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400 pointer-events-none" />
                )}
              </div>
              {labelAutoFilled && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Sugerencia automática — puedes modificarla
                </p>
              )}
            </div>
          </div>

          {/* Capacidad + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Capacidad
                <HelpTooltip className="ml-1.5" text="Máximo de unidades que caben en el slot." side="top" />
              </label>
              <input
                type="number" name="capacity"
                value={formData.capacity ?? ''} onChange={handleChange}
                disabled={busy} min="0" placeholder="Máx. unidades"
                className={`input-field !py-2.5 !text-sm ${errors.capacity ? '!border-red-400' : ''}`}
                suppressHydrationWarning
              />
              {errors.capacity && <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Stock actual
                <HelpTooltip className="ml-1.5" text="Unidades disponibles en este momento." side="top" />
              </label>
              <input
                type="number" name="current_stock"
                value={formData.current_stock ?? ''} onChange={handleChange}
                disabled={busy} min="0" placeholder="Unidades actuales"
                className={`input-field !py-2.5 !text-sm ${errors.current_stock ? '!border-red-400' : ''}`}
                suppressHydrationWarning
              />
              {errors.current_stock && <p className="text-xs text-red-600 mt-1">{errors.current_stock}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-muted bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              suppressHydrationWarning
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              suppressHydrationWarning
            >
              {busy
                ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : isEdit ? 'Guardando...' : 'Creando...'}</>
                : <><Save className="h-4 w-4" />{isEdit ? 'Guardar cambios' : 'Crear slot'}</>
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
