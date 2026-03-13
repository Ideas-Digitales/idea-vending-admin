'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { getProductsAction } from '@/lib/actions/products';
import { UpdateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { Save, Loader2, CheckCircle, XCircle, Package, AlertCircle } from 'lucide-react';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { PageHeader } from '@/components/ui-custom';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { TourRunner, type Step } from '@/components/help/TourRunner';

const EDIT_SLOT_TOUR: Step[] = [
  {
    element: '[data-tour="slot-mdb"]',
    popover: {
      title: '¿Qué es el código MDB?',
      description: 'El <b>código MDB</b> identifica este slot dentro del protocolo de la máquina. Cambiarlo puede afectar la comunicación con el hardware — hazlo solo si sabes lo que implica.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="slot-stock"]',
    popover: {
      title: 'Actualizar stock',
      description: '<p>Edita la <b>capacidad</b> y el <b>stock actual</b> para reflejar el estado real del compartimento.</p><p>Cuando el stock baje del umbral de alerta, el sistema notificará que hay que reponer.</p>',
      side: 'right',
    },
  },
];

export default function EditSlotPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const slotId    = params.slotId as string;
  const backHref  = `/maquinas/${machineId}?tab=productos`;

  const { slots, updateSlot, isUpdating, updateError, fetchSlots, clearErrors } = useSlotStore();
  const { selectedMachine, fetchMachine } = useMachineStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [formData, setFormData] = useState<UpdateSlot>({
    mdb_code: 0, label: '', product_id: null, capacity: null, current_stock: null,
  });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [success, setSuccess]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    if (machineId) { fetchMachine(Number(machineId)); fetchSlots(Number(machineId)); }
    return () => { clearErrors(); };
  }, [machineId, fetchMachine, fetchSlots, clearErrors]);

  useEffect(() => {
    if (selectedMachine?.id !== Number(machineId) || !selectedMachine?.enterprise_id) return;
    setIsLoadingProducts(true);
    getProductsAction({ page: 1, limit: 200, enterpriseId: selectedMachine.enterprise_id })
      .then(res => { if (res.success && res.products) setProducts(res.products); })
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, [selectedMachine?.id, selectedMachine?.enterprise_id, machineId]);

  useEffect(() => {
    const slot = slots.find(s => s.id === Number(slotId));
    if (slot) {
      setFormData({ mdb_code: slot.mdb_code, label: slot.label || '', product_id: slot.product_id, capacity: slot.capacity, current_stock: slot.current_stock });
      setIsLoading(false);
    }
  }, [slots, slotId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (updateError) clearErrors();
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
    const updated = await updateSlot(Number(machineId), Number(slotId), formData);
    if (updated) {
      try {
        await publishSlotOperation({
          action: 'update', machineId: Number(machineId), slotId: updated.id,
          slotData: { id: updated.id, mdb_code: updated.mdb_code, label: updated.label, product_id: updated.product_id, machine_id: Number(machineId), capacity: updated.capacity, current_stock: updated.current_stock },
        });
      } catch { /* MQTT no es crítico */ }
      setSuccess(true);
      setTimeout(() => router.push(backHref), 1200);
    }
  };

  const busy = isUpdating || isPublishing;

  return (
    <>
      <PageHeader
        icon={Package}
        title="Editar slot"
        subtitle={selectedMachine ? selectedMachine.name : undefined}
        backHref={backHref}
        variant="white"
        actions={<TourRunner steps={EDIT_SLOT_TOUR} theme="light" />}
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-md mx-auto">

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm">Cargando slot...</span>
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Slot actualizado correctamente</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Redirigiendo al inventario...</p>
                  </div>
                </div>
              )}

              {updateError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 flex-1">{updateError}</p>
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
                      text="Identificador del slot en el protocolo MDB de la máquina. Cambiarlo afecta la comunicación con el hardware."
                      side="right"
                    />
                  </label>
                  <input
                    type="number" name="mdb_code"
                    value={formData.mdb_code ?? ''} onChange={handleChange}
                    required min="0" disabled={busy}
                    className={`input-field !py-2.5 !text-sm ${errors.mdb_code ? '!border-red-400' : ''}`}
                    suppressHydrationWarning
                  />
                  {errors.mdb_code && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.mdb_code}</p>}
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Etiqueta
                    <HelpTooltip className="ml-1.5"
                      text="Nombre visible del slot en el inventario: A1, Fila 2, Snack superior…"
                      side="right"
                    />
                  </label>
                  <input
                    type="text" name="label"
                    value={formData.label || ''} onChange={handleChange}
                    disabled={busy} maxLength={50}
                    placeholder="Ej: A1, B2, Snack superior"
                    className="input-field !py-2.5 !text-sm"
                    suppressHydrationWarning
                  />
                </div>

                {/* Producto */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Producto
                    <HelpTooltip className="ml-1.5"
                      text="Producto del catálogo que se vende en este slot."
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

                {/* Capacidad + Stock — 2 cols */}
                <div data-tour="slot-stock" className="grid grid-cols-2 gap-3">
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
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : 'Guardando...'}</>
                      : <><Save className="h-4 w-4" />Guardar cambios</>
                    }
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
