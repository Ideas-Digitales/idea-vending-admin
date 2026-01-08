'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { getProductsAction } from '@/lib/actions/products';
import { UpdateSlot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { ArrowLeft, Package, Save, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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
    async function loadProducts() {
      try {
        const response = await getProductsAction({ page: 1, limit: 100 });
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
  }, []);

  useEffect(() => {
    // Cargar datos del slot cuando estén disponibles
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
    
    // Limpiar mensajes al editar
    if (successMessage) setSuccessMessage(null);
    if (updateError) clearErrors();
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Manejar campos numéricos
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

    // Convertir a número o null
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

    const success = await updateSlot(Number(machineId), Number(slotId), formData);

    if (success) {
      setSuccessMessage('¡Slot actualizado exitosamente!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleBack = () => {
    router.push('/maquinas');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Cargando slot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Máquinas
        </button>

        <h1 className="text-3xl font-bold text-black">Editar Slot</h1>
        {selectedMachine && (
          <p className="text-gray-600 mt-2">
            Máquina: <span className="font-semibold text-black">{selectedMachine.name}</span>
          </p>
        )}
      </div>

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
            <button
              onClick={clearErrors}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <p className="text-sm text-gray-600 mt-1">
              Identificador local del producto en la máquina
            </p>
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
              placeholder="Ej: A1, B2, C3 (opcional, se usa mdb_code por defecto)"
            />
            <p className="text-sm text-gray-600 mt-1">
              Etiqueta descriptiva del slot (opcional)
            </p>
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
            <p className="text-sm text-gray-600 mt-1">
              Selecciona un producto o escribe para buscar
            </p>
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
            <p className="text-sm text-gray-600 mt-1">
              Número máximo de productos que caben en el slot
            </p>
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
            <p className="text-sm text-gray-600 mt-1">
              Número actual de productos en el slot
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Actualizando...
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
    </div>
  );
}
