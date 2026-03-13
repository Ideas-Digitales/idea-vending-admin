'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { getProductsAction } from '@/lib/actions/products';
import { CreateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { Save, Loader2, CheckCircle, XCircle, Package, AlertCircle } from 'lucide-react';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { PageHeader } from '@/components/ui-custom';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { TourRunner, type Step } from '@/components/help/TourRunner';

const CREATE_SLOT_TOUR: Step[] = [
  {
    element: '[data-tour="slot-mdb"]',
    popover: {
      title: '¿Qué es un slot?',
      description: '<p>Un <b>slot</b> es un compartimento físico de la máquina — un carril, una espiral o una posición donde se almacena un producto.</p><p>El <b>código MDB</b> es el número que identifica ese compartimento dentro del protocolo de la máquina. Cada slot debe tener un código único.</p>',
      side: 'right',
    },
  },
  {
    element: '[data-tour="slot-label"]',
    popover: {
      title: '¿Para qué sirve la etiqueta?',
      description: '<p>La <b>etiqueta</b> es el nombre descriptivo que tú asignas al slot para reconocerlo fácilmente: <i>A1, Fila 2, Snack superior</i>…</p><p>Si no la defines, se mostrará el código MDB por defecto.</p>',
      side: 'right',
    },
  },
  {
    element: '[data-tour="slot-product"]',
    popover: {
      title: 'Asignar un producto',
      description: '<p>Elige qué <b>producto</b> se vende en este slot. El producto debe existir en el catálogo de la empresa.</p><p>Puedes dejarlo vacío y asignarlo después desde la vista de inventario.</p>',
      side: 'right',
    },
  },
  {
    element: '[data-tour="slot-stock"]',
    popover: {
      title: 'Capacidad y stock',
      description: '<p><b>Capacidad</b> — número máximo de unidades que caben en el slot.</p><p><b>Stock actual</b> — unidades que hay ahora mismo. Permite al sistema calcular el porcentaje de llenado y alertar cuando sea necesario reponer.</p>',
      side: 'right',
    },
  },
];

export default function CreateSlotPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const backHref = `/maquinas/${machineId}?tab=productos`;

  const { createSlot, isCreating, createError, clearErrors } = useSlotStore();
  const { selectedMachine, fetchMachine } = useMachineStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [formData, setFormData] = useState<CreateSlot>({
    mdb_code: 0,
    label: '',
    product_id: null,
    capacity: null,
    current_stock: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<Producto[]>([]);
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
    setFormData(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (formData.mdb_code === null || formData.mdb_code === undefined || formData.mdb_code < 0)
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
    const created = await createSlot(Number(machineId), formData);
    if (created) {
      try {
        await publishSlotOperation({
          action: 'create', machineId: Number(machineId), slotId: created.id,
          slotData: { id: created.id, mdb_code: created.mdb_code, label: created.label, product_id: created.product_id, machine_id: Number(machineId), capacity: created.capacity, current_stock: created.current_stock },
        });
      } catch { /* MQTT no es crítico */ }
      setSuccess(true);
      setTimeout(() => router.push(backHref), 1200);
    }
  };

  const busy = isCreating || isPublishing;

  return (
    <>
      <PageHeader
        icon={Package}
        title="Nuevo slot"
        subtitle={selectedMachine ? selectedMachine.name : undefined}
        backHref={backHref}
        variant="white"
        actions={<TourRunner steps={CREATE_SLOT_TOUR} theme="light" />}
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-md mx-auto">

          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Slot creado correctamente</p>
                <p className="text-xs text-emerald-600 mt-0.5">Redirigiendo al inventario...</p>
              </div>
            </div>
          )}

          {createError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{createError}</p>
              <button onClick={clearErrors} className="text-red-400 hover:text-red-600">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="card p-6 space-y-5" suppressHydrationWarning>

            {/* MDB Code */}
            <div data-tour="slot-mdb">
              <label className="block text-sm font-medium text-dark mb-1.5">
                Código MDB <span className="text-red-500">*</span>
                <HelpTooltip className="ml-1.5"
                  text="Número que identifica este compartimento dentro del protocolo MDB de la máquina. Debe ser único por máquina."
                  side="right"
                />
              </label>
              <input
                type="number"
                name="mdb_code"
                value={formData.mdb_code ?? ''}
                onChange={handleChange}
                required min="0"
                disabled={busy}
                placeholder="Ej: 1, 2, 3…"
                className={`input-field !py-2.5 !text-sm ${errors.mdb_code ? '!border-red-400' : ''}`}
                suppressHydrationWarning
              />
              {errors.mdb_code && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}</p>}
            </div>

            {/* Label */}
            <div data-tour="slot-label">
              <label className="block text-sm font-medium text-dark mb-1.5">
                Etiqueta
                <HelpTooltip className="ml-1.5"
                  text="Nombre descriptivo para este slot: A1, Fila superior, Snack 3… Ayuda a identificarlo visualmente en el inventario."
                  side="right"
                />
              </label>
              <input
                type="text"
                name="label"
                value={formData.label || ''}
                onChange={handleChange}
                disabled={busy}
                maxLength={50}
                placeholder="Ej: A1, B2, Snack superior"
                className="input-field !py-2.5 !text-sm"
                suppressHydrationWarning
              />
              <p className="text-xs text-muted mt-1">Opcional — se usa el código MDB si no se define</p>
            </div>

            {/* Producto */}
            <div data-tour="slot-product">
              <label className="block text-sm font-medium text-dark mb-1.5">
                Producto
                <HelpTooltip className="ml-1.5"
                  text="Producto del catálogo de la empresa que se vende en este slot. Puedes asignarlo ahora o más adelante."
                  side="right"
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
              )}
            </div>

            {/* Capacidad + Stock — 2 cols */}
            <div data-tour="slot-stock" className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Capacidad
                  <HelpTooltip className="ml-1.5" text="Número máximo de unidades que caben en el slot." side="top" />
                </label>
                <input
                  type="number" name="capacity"
                  value={formData.capacity ?? ''}
                  onChange={handleChange}
                  disabled={busy} min="0"
                  placeholder="Máx. unidades"
                  className={`input-field !py-2.5 !text-sm ${errors.capacity ? '!border-red-400' : ''}`}
                  suppressHydrationWarning
                />
                {errors.capacity && <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Stock actual
                  <HelpTooltip className="ml-1.5" text="Unidades que hay en este slot en este momento." side="top" />
                </label>
                <input
                  type="number" name="current_stock"
                  value={formData.current_stock ?? ''}
                  onChange={handleChange}
                  disabled={busy} min="0"
                  placeholder="Unidades actuales"
                  className={`input-field !py-2.5 !text-sm ${errors.current_stock ? '!border-red-400' : ''}`}
                  suppressHydrationWarning
                />
                {errors.current_stock && <p className="text-xs text-red-600 mt-1">{errors.current_stock}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push(backHref)}
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
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : 'Creando...'}</>
                  : <><Save className="h-4 w-4" />Crear slot</>
                }
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
