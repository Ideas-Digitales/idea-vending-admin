'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { getProductsAction } from '@/lib/actions/products';
import { CreateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import {
  Save, Loader2, CheckCircle, XCircle, Package, AlertCircle,
  Hash, Layers, Tag, BarChart2, ChevronRight, ChevronLeft, Sparkles,
} from 'lucide-react';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { PageHeader } from '@/components/ui-custom';

// ── Pasos ─────────────────────────────────────────────────────
const STEPS = [
  {
    id:          1,
    label:       'Posición',
    icon:        Hash,
    bg:          'bg-blue-50',
    border:      'border-blue-200',
    iconColor:   'text-blue-600',
    title:       'Identifica el slot',
    description: 'Cada slot es una posición física dentro de la máquina. El código MDB es el número único que lo identifica en el protocolo de comunicación entre el controlador y los módulos de venta.',
  },
  {
    id:          2,
    label:       'Producto',
    icon:        Package,
    bg:          'bg-purple-50',
    border:      'border-purple-200',
    iconColor:   'text-purple-600',
    title:       'Asigna un producto',
    description: 'Elige qué producto se vende en este slot. Puedes dejarlo sin asignar ahora y configurarlo más adelante desde el inventario o la vista de reposición.',
  },
  {
    id:          3,
    label:       'Inventario',
    icon:        Layers,
    bg:          'bg-emerald-50',
    border:      'border-emerald-200',
    iconColor:   'text-emerald-600',
    title:       'Configura el inventario',
    description: 'Define cuántas unidades caben en este slot y cuántas hay en este momento. Esto permite calcular el nivel de stock y generar alertas de reposición automáticas.',
  },
];

export default function CreateSlotPage() {
  const params    = useParams();
  const router    = useRouter();
  const machineId = params.id as string;
  const backHref  = `/maquinas/${machineId}?tab=inventario`;

  const { createSlot, isCreating, createError, clearErrors } = useSlotStore();
  const { selectedMachine, fetchMachine }                    = useMachineStore();
  const { publishSlotOperation, isPublishing }               = useMqttSlot();

  const [step, setStep]   = useState(1);
  const [formData, setFormData] = useState<CreateSlot>({
    mdb_code:      0,
    label:         '',
    product_id:    null,
    capacity:      null,
    current_stock: null,
  });
  const [labelAutoFilled, setLabelAutoFilled] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [products, setProducts]               = useState<Producto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    if (machineId) fetchMachine(Number(machineId));
    return () => { clearErrors(); };
  }, [machineId, fetchMachine, clearErrors]);

  useEffect(() => {
    if (selectedMachine?.id !== Number(machineId) || !selectedMachine?.enterprise_id) return;
    setIsLoadingProducts(true);
    getProductsAction({ page: 1, limit: 200, enterpriseId: selectedMachine.enterprise_id })
      .then(res => { if (res.success && res.products) setProducts(res.products); })
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, [selectedMachine?.id, selectedMachine?.enterprise_id, machineId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (createError) clearErrors();
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
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
    if (s === 1) {
      if (formData.mdb_code === null || formData.mdb_code === undefined || formData.mdb_code < 0)
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

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    const created = await createSlot(Number(machineId), formData);
    if (created) {
      try {
        await publishSlotOperation({
          action: 'create', machineId: Number(machineId), slotId: created.id,
          slotData: {
            id: created.id, mdb_code: created.mdb_code, label: created.label,
            product_id: created.product_id, machine_id: Number(machineId),
            capacity: created.capacity, current_stock: created.current_stock,
          },
        });
      } catch { /* MQTT no crítico */ }
      setSuccess(true);
      setTimeout(() => router.push(backHref), 1200);
    }
  };

  const busy          = isCreating || isPublishing;
  const currentStep   = STEPS[step - 1];
  const StepIcon      = currentStep.icon;
  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <>
      <PageHeader
        icon={Package}
        title="Nuevo slot"
        subtitle={selectedMachine ? selectedMachine.name : undefined}
        backHref={backHref}
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-lg mx-auto">

          {/* Success */}
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Slot creado correctamente</p>
                <p className="text-xs text-emerald-600 mt-0.5">Redirigiendo al inventario...</p>
              </div>
            </div>
          )}

          {/* API Error */}
          {createError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{createError}</p>
              <button onClick={clearErrors} className="text-red-400 hover:text-red-600">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Indicador de pasos ────────────────────────────── */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((s, i) => {
              const Icon        = s.icon;
              const isCompleted = step > s.id;
              const isActive    = step === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      isCompleted ? 'bg-emerald-500 border-emerald-500' :
                      isActive    ? `${s.bg} ${s.border}` :
                                    'bg-gray-50 border-gray-200'
                    }`}>
                      {isCompleted
                        ? <CheckCircle className="h-5 w-5 text-white" />
                        : <Icon className={`h-4 w-4 ${isActive ? s.iconColor : 'text-gray-400'}`} />
                      }
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      isActive    ? 'text-dark'         :
                      isCompleted ? 'text-emerald-600'  :
                                    'text-muted'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all duration-300 ${
                      step > s.id ? 'bg-emerald-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Tarjeta del paso ──────────────────────────────── */}
          <div className="card overflow-hidden">

            {/* Cabecera del paso */}
            <div className={`${currentStep.bg} px-6 py-5 border-b ${currentStep.border}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${currentStep.bg} border-2 ${currentStep.border} flex items-center justify-center flex-shrink-0`}>
                  <StepIcon className={`h-6 w-6 ${currentStep.iconColor}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${currentStep.iconColor} mb-0.5`}>
                    Paso {step} de {STEPS.length}
                  </p>
                  <h2 className="text-base font-bold text-dark">{currentStep.title}</h2>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{currentStep.description}</p>
                </div>
              </div>
            </div>

            {/* Contenido del paso */}
            <div className="p-6 space-y-5">

              {/* ── Paso 1: MDB + Etiqueta ── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Código MDB <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        name="mdb_code"
                        value={formData.mdb_code ?? ''}
                        onChange={handleChange}
                        required min="0"
                        disabled={busy}
                        placeholder="Ej: 1, 2, 3…"
                        className={`input-field !py-2.5 !text-sm !pl-9 ${errors.mdb_code ? '!border-red-400' : ''}`}
                        suppressHydrationWarning
                        autoFocus
                      />
                    </div>
                    {errors.mdb_code
                      ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}</p>
                      : <p className="text-xs text-muted mt-1">Número único por máquina. Consúltalo en el manual o configuración del equipo.</p>
                    }
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Etiqueta</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        name="label"
                        value={formData.label || ''}
                        onChange={handleChange}
                        disabled={busy}
                        maxLength={50}
                        placeholder="Ej: A1, B2, Snack superior"
                        className="input-field !py-2.5 !text-sm !pl-9"
                        suppressHydrationWarning
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">Opcional — nombre descriptivo para identificarlo en el inventario.</p>
                  </div>
                </>
              )}

              {/* ── Paso 2: Producto ── */}
              {step === 2 && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Producto</label>
                  {isLoadingProducts ? (
                    <div className="flex items-center gap-2 text-sm text-muted py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando productos...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">
                        No hay productos en el catálogo de esta empresa. Puedes crear el slot igualmente y asignarlo más adelante.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        name="product_id"
                        value={formData.product_id ?? ''}
                        onChange={handleChange}
                        disabled={busy}
                        className="input-field !py-2.5 !text-sm"
                      >
                        <option value="">Sin producto asignado</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      {selectedProduct ? (
                        <div className="mt-3 flex items-center gap-3 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
                          <Package className="h-4 w-4 text-purple-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-purple-800">{selectedProduct.name}</p>
                            {labelAutoFilled && (
                              <p className="text-xs text-purple-500 flex items-center gap-1 mt-0.5">
                                <Sparkles className="h-3 w-3" /> Etiqueta sugerida automáticamente desde el nombre del producto
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted mt-1.5">Puedes asignarlo después desde el inventario o la vista de reposición.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Paso 3: Inventario ── */}
              {step === 3 && (
                <>
                  {/* Resumen de pasos anteriores */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-dark">MDB {formData.mdb_code}</span>
                      {formData.label && <span>· {formData.label}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      <span>{selectedProduct ? selectedProduct.name : 'Sin producto asignado'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">Capacidad</label>
                      <div className="relative">
                        <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                          type="number" name="capacity"
                          value={formData.capacity ?? ''}
                          onChange={handleChange}
                          disabled={busy} min="0"
                          placeholder="Máx. unidades"
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
                          value={formData.current_stock ?? ''}
                          onChange={handleChange}
                          disabled={busy} min="0"
                          placeholder="Unidades actuales"
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

            {/* ── Acciones del paso ─────────────────────────────── */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={step === 1 ? () => router.push(backHref) : handleBack}
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
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
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
          </div>

        </div>
      </main>
    </>
  );
}
