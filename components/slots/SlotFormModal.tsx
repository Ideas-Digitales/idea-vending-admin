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
import {
  Save, Loader2, XCircle, AlertCircle, Package, Sparkles,
  Hash, Layers, Tag, BarChart2, ChevronRight, ChevronLeft, CheckCircle,
} from 'lucide-react';

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
  mdb_code:      number | null;
  label:         string;
  product_id:    number | null;
  capacity:      number | null;
  current_stock: number | null;
};

const EMPTY_FORM: FormData = {
  mdb_code:      null,
  label:         '',
  product_id:    null,
  capacity:      null,
  current_stock: null,
};

// ── Pasos (solo para crear) ────────────────────────────────────
const STEPS = [
  {
    id:          1,
    label:       'Producto',
    icon:        Package,
    bg:          'bg-purple-50',
    border:      'border-purple-200',
    iconColor:   'text-purple-600',
    title:       'Asigna un producto',
    description: 'Elige qué producto se vende en este slot. Es opcional — puedes dejarlo vacío y asignarlo más adelante. Si lo seleccionas ahora, usaremos su nombre como etiqueta del slot.',
  },
  {
    id:          2,
    label:       'Posición',
    icon:        Hash,
    bg:          'bg-blue-50',
    border:      'border-blue-200',
    iconColor:   'text-blue-600',
    title:       'Identifica el slot',
    description: 'El código MDB es el número único que identifica este compartimento en el protocolo de la máquina.',
  },
  {
    id:          3,
    label:       'Inventario',
    icon:        Layers,
    bg:          'bg-emerald-50',
    border:      'border-emerald-200',
    iconColor:   'text-emerald-600',
    title:       'Configura el inventario',
    description: 'Define cuántas unidades caben y cuántas hay ahora. Esto activa las alertas de reposición.',
  },
];

export default function SlotFormModal({
  open, onOpenChange, machineId, slot, products, isLoadingProducts, onSuccess,
}: SlotFormModalProps) {
  const isEdit = !!slot;

  const { createSlot, updateSlot, isCreating, isUpdating, createError, updateError, clearErrors } = useSlotStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [formData, setFormData]               = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [labelAutoFilled, setLabelAutoFilled] = useState(false);
  const [step, setStep]                       = useState(1);

  // Populate / reset form when modal opens
  useEffect(() => {
    if (!open) return;
    if (slot) {
      setFormData({
        mdb_code:      slot.mdb_code,
        label:         slot.label || '',
        product_id:    slot.product_id,
        capacity:      slot.capacity,
        current_stock: slot.current_stock,
      });
    } else {
      setFormData(EMPTY_FORM);
      setStep(1);
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
    const parsed    = numFields.includes(name) ? (value === '' ? null : Number(value)) : value;

    if (name === 'product_id') {
      const product = products.find(p => String(p.id) === value);
      setFormData(prev => {
        const newLabel = product && (prev.label === '' || labelAutoFilled) ? product.name : prev.label;
        if (product && (prev.label === '' || labelAutoFilled)) setLabelAutoFilled(true);
        else if (!product) setLabelAutoFilled(false);
        return { ...prev, product_id: parsed as number | null, label: newLabel };
      });
      return;
    }
    if (name === 'label') setLabelAutoFilled(false);
    setFormData(prev => ({ ...prev, [name]: parsed }));
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 2) {
      if (formData.mdb_code == null || formData.mdb_code < 0)
        e.mdb_code = 'Requerido y debe ser ≥ 0';
    }
    if (s === 3) {
      if (formData.capacity != null && formData.capacity < 0)
        e.capacity = 'No puede ser negativo';
      if (formData.current_stock != null && formData.current_stock < 0)
        e.current_stock = 'No puede ser negativo';
      if (formData.capacity != null && formData.current_stock != null && formData.current_stock > formData.capacity)
        e.current_stock = 'No puede superar la capacidad';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Edit-mode single validation
  const validateAll = (): boolean => {
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

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (isEdit) {
      if (!validateAll()) return;
      const payload: UpdateSlot = {
        mdb_code:      formData.mdb_code ?? undefined,
        label:         formData.label,
        product_id:    formData.product_id,
        capacity:      formData.capacity,
        current_stock: formData.current_stock,
      };
      const updated = await updateSlot(machineId, slot!.id, payload);
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
      if (!validateStep(3)) return;
      const payload: CreateSlot = {
        mdb_code:      formData.mdb_code ?? 0,
        label:         formData.label,
        product_id:    formData.product_id,
        capacity:      formData.capacity,
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

  const busy     = isCreating || isUpdating || isPublishing;
  const apiError = isEdit ? updateError : createError;

  const currentStep    = STEPS[step - 1];
  const StepIcon       = currentStep.icon;
  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }}>
      <DialogContent className={isEdit ? 'sm:max-w-md' : 'sm:max-w-lg'} showCloseButton={!busy}>

        {/* ── API error ── */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5 mb-1">
            <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{apiError}</p>
            <button onClick={clearErrors} className="text-red-400 hover:text-red-600">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            MODO EDICIÓN — formulario simple en una sola pantalla
        ════════════════════════════════════════════════════ */}
        {isEdit && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <DialogTitle className="text-base">
                  Editar slot — {slot?.label || `MDB ${slot?.mdb_code}`}
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
              {/* Producto */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Producto
                  <HelpTooltip className="ml-1.5" text="Producto del catálogo que se vende en este slot. Al seleccionarlo se sugiere la etiqueta automáticamente." side="top" />
                </label>
                {isLoadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-muted py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                  </div>
                ) : (
                  <select name="product_id" value={formData.product_id ?? ''} onChange={handleChange} disabled={busy} className="input-field !py-2.5 !text-sm">
                    <option value="">Sin producto asignado</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>

              {/* MDB + Etiqueta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Código MDB <span className="text-red-500">*</span>
                    <HelpTooltip className="ml-1.5" text="Número que identifica el compartimento en el protocolo MDB. Debe ser único por máquina." side="top" />
                  </label>
                  <input
                    type="number" name="mdb_code"
                    value={formData.mdb_code ?? ''} onChange={handleChange}
                    required min="0" disabled={busy} placeholder="Ej: 1, 2, 3…"
                    className={`input-field !py-2.5 !text-sm ${errors.mdb_code ? '!border-red-400' : ''}`}
                    suppressHydrationWarning
                  />
                  {errors.mdb_code && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Etiqueta
                    <HelpTooltip className="ml-1.5" text="Nombre visible del slot: A1, Fila 2… Si no se define, se usa el código MDB." side="top" />
                  </label>
                  <div className="relative">
                    <input
                      type="text" name="label"
                      value={formData.label || ''} onChange={handleChange}
                      disabled={busy} maxLength={50} placeholder="Ej: A1, B2…"
                      className={`input-field !py-2.5 !text-sm ${labelAutoFilled ? '!pr-8 !border-amber-300 !bg-amber-50/40' : ''}`}
                      suppressHydrationWarning
                    />
                    {labelAutoFilled && <Sparkles className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400 pointer-events-none" />}
                  </div>
                  {labelAutoFilled && <p className="mt-1 text-xs text-amber-600 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Sugerencia automática</p>}
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

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="px-4 py-2 text-sm font-medium text-muted bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" suppressHydrationWarning>
                  Cancelar
                </button>
                <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50" suppressHydrationWarning>
                  {busy
                    ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : 'Guardando...'}</>
                    : <><Save className="h-4 w-4" />Guardar cambios</>
                  }
                </button>
              </div>
            </form>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MODO CREACIÓN — formulario de múltiples pasos
        ════════════════════════════════════════════════════ */}
        {!isEdit && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <DialogTitle className="text-base">Nuevo slot</DialogTitle>
              </div>
            </DialogHeader>

            {/* Indicador de pasos */}
            <div className="flex items-center justify-center mb-5">
              {STEPS.map((s, i) => {
                const Icon        = s.icon;
                const isCompleted = step > s.id;
                const isActive    = step === s.id;
                return (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-500' :
                        isActive    ? `${s.bg} ${s.border}` :
                                      'bg-gray-50 border-gray-200'
                      }`}>
                        {isCompleted
                          ? <CheckCircle className="h-4 w-4 text-white" />
                          : <Icon className={`h-4 w-4 ${isActive ? s.iconColor : 'text-gray-400'}`} />
                        }
                      </div>
                      <span className={`text-[10px] font-medium ${isActive ? 'text-dark' : isCompleted ? 'text-emerald-600' : 'text-muted'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-12 sm:w-16 h-0.5 mx-1.5 mb-4 transition-all duration-300 ${step > s.id ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cabecera del paso */}
            <div className={`${currentStep.bg} rounded-xl border ${currentStep.border} px-4 py-3.5 mb-5`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${currentStep.bg} border ${currentStep.border} flex items-center justify-center flex-shrink-0`}>
                  <StepIcon className={`h-5 w-5 ${currentStep.iconColor}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${currentStep.iconColor}`}>Paso {step} de {STEPS.length}</p>
                  <p className="text-sm font-bold text-dark mt-0.5">{currentStep.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{currentStep.description}</p>
                </div>
              </div>
            </div>

            {/* Contenido del paso */}
            <div className="space-y-4">

              {/* ── Paso 1: Producto ── */}
              {step === 1 && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Producto</label>
                  {isLoadingProducts ? (
                    <div className="flex items-center gap-2 text-sm text-muted py-3">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">No hay productos en el catálogo. Puedes asignarlo más adelante.</p>
                    </div>
                  ) : (
                    <>
                      <select name="product_id" value={formData.product_id ?? ''} onChange={handleChange} disabled={busy} className="input-field !py-2.5 !text-sm" autoFocus>
                        <option value="">Sin producto asignado</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {selectedProduct ? (
                        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
                          <Package className="h-4 w-4 text-purple-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-purple-800">{selectedProduct.name}</p>
                            <p className="text-xs text-purple-500 flex items-center gap-1 mt-0.5">
                              <Sparkles className="h-3 w-3" /> Se usará como etiqueta del slot en el siguiente paso
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted mt-1.5">Puedes asignarlo después desde el inventario.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Paso 2: MDB + Etiqueta ── */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Código MDB <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="number" name="mdb_code"
                        value={formData.mdb_code ?? ''} onChange={handleChange}
                        required min="0" disabled={busy} placeholder="Ej: 1, 2, 3…"
                        className={`input-field !py-2.5 !text-sm !pl-9 ${errors.mdb_code ? '!border-red-400' : ''}`}
                        suppressHydrationWarning autoFocus
                      />
                    </div>
                    {errors.mdb_code
                      ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}</p>
                      : <p className="text-xs text-muted mt-1">Número único por máquina. Consúltalo en el manual del equipo.</p>
                    }
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Etiqueta</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text" name="label"
                        value={formData.label || ''} onChange={handleChange}
                        disabled={busy} maxLength={50} placeholder="Ej: A1, B2, Snack superior"
                        className={`input-field !py-2.5 !text-sm !pl-9 ${labelAutoFilled ? '!pr-8 !border-amber-300 !bg-amber-50/40' : ''}`}
                        suppressHydrationWarning
                      />
                      {labelAutoFilled && <Sparkles className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400 pointer-events-none" />}
                    </div>
                    {labelAutoFilled
                      ? <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Sugerida desde el producto — puedes modificarla</p>
                      : <p className="text-xs text-muted mt-1">Opcional — nombre descriptivo para identificarlo en el inventario.</p>
                    }
                  </div>
                </>
              )}

              {/* ── Paso 3: Inventario ── */}
              {step === 3 && (
                <>
                  {/* Resumen */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      <span>{selectedProduct ? selectedProduct.name : 'Sin producto asignado'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-dark">MDB {formData.mdb_code}</span>
                      {formData.label && <span>· {formData.label}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">Capacidad</label>
                      <div className="relative">
                        <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                          type="number" name="capacity"
                          value={formData.capacity ?? ''} onChange={handleChange}
                          disabled={busy} min="0" placeholder="Máx. unidades"
                          className={`input-field !py-2.5 !text-sm !pl-9 ${errors.capacity ? '!border-red-400' : ''}`}
                          suppressHydrationWarning
                        />
                      </div>
                      {errors.capacity
                        ? <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>
                        : <p className="text-xs text-muted mt-1">Máximo de unidades que caben físicamente.</p>
                      }
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">Stock actual</label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                          type="number" name="current_stock"
                          value={formData.current_stock ?? ''} onChange={handleChange}
                          disabled={busy} min="0" placeholder="Unidades actuales"
                          className={`input-field !py-2.5 !text-sm !pl-9 ${errors.current_stock ? '!border-red-400' : ''}`}
                          suppressHydrationWarning
                        />
                      </div>
                      {errors.current_stock
                        ? <p className="text-xs text-red-600 mt-1">{errors.current_stock}</p>
                        : <p className="text-xs text-muted mt-1">Unidades disponibles en este momento.</p>
                      }
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={step === 1 ? () => onOpenChange(false) : handleBack}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {busy
                    ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : 'Creando...'}</>
                    : <><Save className="h-4 w-4" />Crear slot</>
                  }
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
