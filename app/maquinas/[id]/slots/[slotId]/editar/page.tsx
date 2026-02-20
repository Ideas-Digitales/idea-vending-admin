'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { getProductsAction } from '@/lib/actions/products';
import { UpdateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { Package, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { AppShell, PageHeader } from '@/components/ui-custom';

export default function EditSlotPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const slotId = params.slotId as string;

  const {
    slots,
    updateSlot,
    isUpdating,
    updateError,
    fetchSlots,
    clearErrors
  } = useSlotStore();

  const { selectedMachine, fetchMachine } = useMachineStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [formData, setFormData] = useState<UpdateSlot>({
    mdb_code: 0,
    label: '',
    product_id: null,
    capacity: null,
    current_stock: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (machineId) {
        await fetchMachine(Number(machineId));
        await fetchSlots(Number(machineId));
      }
    };

    loadData();

    return () => {
      clearErrors();
    };
  }, [machineId, fetchMachine, fetchSlots, clearErrors]);

  useEffect(() => {
    // Esperar a que selectedMachine sea la de esta página (no una stale de navegación previa)
    if (selectedMachine?.id !== Number(machineId) || !selectedMachine?.enterprise_id) return;

    setIsLoadingProducts(true);
    async function loadProducts() {
      try {
        const response = await getProductsAction({
          page: 1,
          limit: 200,
          enterpriseId: selectedMachine!.enterprise_id,
        });
        if (response.success && response.products) {
          setProducts(response.products);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, [selectedMachine?.id, selectedMachine?.enterprise_id, machineId]);

  useEffect(() => {
    const currentSlot = slots.find(s => s.id === Number(slotId));
    if (currentSlot) {
      setFormData({
        mdb_code: currentSlot.mdb_code,
        label: currentSlot.label || '',
        product_id: currentSlot.product_id,
        capacity: currentSlot.capacity,
        current_stock: currentSlot.current_stock,
      });
      setIsLoading(false);
    }
  }, [slots, slotId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (successMessage) setSuccessMessage(null);
    if (updateError) clearErrors();
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (['mdb_code', 'capacity', 'current_stock'].includes(name)) {
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (successMessage) setSuccessMessage(null);
    if (updateError) clearErrors();

    const processedValue = value === '' ? null : Number(value);

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mdb_code || formData.mdb_code <= 0) {
      newErrors.mdb_code = 'El código MDB es requerido y debe ser positivo';
    }

    if (formData.capacity !== null && formData.capacity !== undefined && formData.capacity < 0) {
      newErrors.capacity = 'La capacidad no puede ser negativa';
    }

    if (formData.current_stock !== null && formData.current_stock !== undefined && formData.current_stock < 0) {
      newErrors.current_stock = 'El stock actual no puede ser negativo';
    }

    if (
      formData.capacity !== null &&
      formData.capacity !== undefined &&
      formData.current_stock !== null &&
      formData.current_stock !== undefined &&
      formData.current_stock > formData.capacity
    ) {
      newErrors.current_stock = 'El stock actual no puede ser mayor que la capacidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updatedSlot = await updateSlot(Number(machineId), Number(slotId), formData);

    if (updatedSlot) {
      try {
        await publishSlotOperation({
          action: 'update',
          machineId: Number(machineId),
          slotId: updatedSlot.id,
          slotData: {
            id: updatedSlot.id,
            mdb_code: updatedSlot.mdb_code,
            label: updatedSlot.label,
            product_id: updatedSlot.product_id,
            machine_id: Number(machineId),
            capacity: updatedSlot.capacity,
            current_stock: updatedSlot.current_stock,
          },
        });
      } catch (mqttError) {
        console.error('Error al sincronizar slot vía MQTT:', mqttError);
        return;
      }

      setSuccessMessage('¡Slot actualizado y sincronizado exitosamente!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <AppShell>
      <PageHeader
        icon={Package}
        title="Editar Slot"
        subtitle={selectedMachine ? `Máquina: ${selectedMachine.name}` : undefined}
        backHref={`/maquinas/${machineId}/slots`}
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600">Cargando slot...</span>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">¡Éxito!</h3>
                      <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                    </div>
                    <button
                      onClick={() => setSuccessMessage(null)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {updateError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{updateError}</p>
                    </div>
                    <button onClick={clearErrors} className="text-red-500 hover:text-red-700">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="space-y-6">
                  {/* MDB Code */}
                  <div>
                    <label htmlFor="mdb_code" className="block text-sm font-medium text-black mb-2">
                      Código MDB <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="mdb_code"
                      name="mdb_code"
                      value={formData.mdb_code || ''}
                      onChange={handleInputChange}
                      className={`input-field ${errors.mdb_code ? 'border-red-500' : ''}`}
                      required
                      min="1"
                      disabled={isUpdating}
                    />
                    {errors.mdb_code && (
                      <p className="text-sm text-red-600 mt-1">{errors.mdb_code}</p>
                    )}
                  </div>

                  {/* Label */}
                  <div>
                    <label htmlFor="label" className="block text-sm font-medium text-black mb-2">
                      Etiqueta
                    </label>
                    <input
                      type="text"
                      id="label"
                      name="label"
                      value={formData.label || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      maxLength={50}
                      disabled={isUpdating}
                      placeholder="Ej: A1, B2, C3"
                    />
                  </div>

                  {/* Producto */}
                  <div>
                    <label htmlFor="product_id" className="block text-sm font-medium text-black mb-2">
                      Producto
                    </label>
                    {isLoadingProducts ? (
                      <div className="flex items-center text-gray-500 py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cargando productos...
                      </div>
                    ) : (
                      <select
                        id="product_id"
                        name="product_id"
                        value={formData.product_id || ''}
                        onChange={handleSelectChange}
                        className="input-field"
                        disabled={isUpdating}
                      >
                        <option value="">Seleccionar producto (opcional)</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (ID: {product.id})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-black mb-2">
                      Capacidad
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity || ''}
                      onChange={handleInputChange}
                      className={`input-field ${errors.capacity ? 'border-red-500' : ''}`}
                      min="0"
                      disabled={isUpdating}
                      placeholder="Capacidad máxima del slot"
                    />
                    {errors.capacity && (
                      <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>
                    )}
                  </div>

                  {/* Current Stock */}
                  <div>
                    <label htmlFor="current_stock" className="block text-sm font-medium text-black mb-2">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      id="current_stock"
                      name="current_stock"
                      value={formData.current_stock ?? ''}
                      onChange={handleInputChange}
                      className={`input-field ${errors.current_stock ? 'border-red-500' : ''}`}
                      min="0"
                      disabled={isUpdating}
                      placeholder="Cantidad actual de productos"
                    />
                    {errors.current_stock && (
                      <p className="text-sm text-red-600 mt-1">{errors.current_stock}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push(`/maquinas/${machineId}/slots`)}
                    disabled={isUpdating || isPublishing}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || isPublishing}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isUpdating || isPublishing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {isPublishing ? 'Sincronizando...' : 'Actualizando...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
