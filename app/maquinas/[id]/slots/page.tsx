'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSlotStore } from '@/lib/stores/slotStore';
import { useMachineStore } from '@/lib/stores/machineStore';
import { SlotAdapter } from '@/lib/adapters/slot.adapter';
import { Slot } from '@/lib/interfaces/slot.interface';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function SlotsPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const { 
    slots, 
    isLoading, 
    error, 
    fetchSlots, 
    updateSlot,
    deleteSlot,
    clearErrors,
    clearSlots,
  } = useSlotStore();

  const { selectedMachine, fetchMachine } = useMachineStore();

  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stockUpdateSlot, setStockUpdateSlot] = useState<Slot | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  useEffect(() => {
    if (machineId) {
      fetchSlots(Number(machineId));
      fetchMachine(Number(machineId));
    }

    return () => {
      clearSlots();
      clearErrors();
    };
  }, [machineId, fetchSlots, fetchMachine, clearSlots, clearErrors]);

  const handleDeleteClick = (slot: Slot) => {
    setSlotToDelete(slot);
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;

    setIsDeleting(true);
    const success = await deleteSlot(Number(machineId), slotToDelete.id);
    setIsDeleting(false);

    if (success) {
      try {
        await publishSlotOperation({
          action: 'delete',
          machineId: Number(machineId),
          slotId: slotToDelete.id,
        });
      } catch (mqttError) {
        console.error('Error al notificar eliminación de slot via MQTT:', mqttError);
        return;
      }
      setSlotToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setSlotToDelete(null);
  };

  const handleStockUpdateClick = (slot: Slot) => {
    setStockUpdateSlot(slot);
    setNewStockValue(slot.current_stock || 0);
  };

  const handleStockUpdateConfirm = async () => {
    if (!stockUpdateSlot) return;

    setIsUpdatingStock(true);
    const updatedSlot = await updateSlot(Number(machineId), stockUpdateSlot.id, {
      current_stock: newStockValue,
    });
    setIsUpdatingStock(false);

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
        console.error('Error al sincronizar actualización de stock via MQTT:', mqttError);
        return;
      }
      setStockUpdateSlot(null);
    }
  };

  const handleStockUpdateCancel = () => {
    setStockUpdateSlot(null);
  };

  const getStockStatusColor = (slot: Slot) => {
    if (SlotAdapter.isEmpty(slot)) return 'text-red-600';
    if (SlotAdapter.isLowStock(slot)) return 'text-yellow-600';
    if (SlotAdapter.isFull(slot)) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStockStatusIcon = (slot: Slot) => {
    if (SlotAdapter.isEmpty(slot)) return <XCircle className="h-5 w-5" />;
    if (SlotAdapter.isLowStock(slot)) return <AlertTriangle className="h-5 w-5" />;
    if (SlotAdapter.isFull(slot)) return <CheckCircle className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };

  const getStockStatusText = (slot: Slot) => {
    if (SlotAdapter.isEmpty(slot)) return 'Vacío';
    if (SlotAdapter.isLowStock(slot)) return 'Stock Bajo';
    if (SlotAdapter.isFull(slot)) return 'Lleno';
    return 'Normal';
  };

  const navigateToMachines = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/maquinas';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={navigateToMachines}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Máquinas
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Gestión de Slots</h1>
            {selectedMachine && (
              <p className="text-gray-600 mt-2">
                Máquina: <span className="font-semibold text-black">{selectedMachine.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => router.push(`/maquinas/${machineId}/slots/crear`)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Slot
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Cargando slots...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && slots.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black mb-2">No hay slots configurados</h3>
          <p className="text-gray-600 mb-6">
            Comienza agregando slots (carriles) a esta máquina vending
          </p>
          <button
            onClick={() => router.push(`/maquinas/${machineId}/slots/crear`)}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Primer Slot
          </button>
        </div>
      )}

      {/* Slots Grid */}
      {!isLoading && slots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slots.map((slot) => {
            const stockPercentage = SlotAdapter.getStockPercentage(slot);
            
            return (
              <div
                key={slot.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Slot Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${getStockStatusColor(slot)} mr-3`}>
                      {getStockStatusIcon(slot)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {slot.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Código: {slot.mdb_code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`text-sm font-semibold ${getStockStatusColor(slot)}`}>
                      {getStockStatusText(slot)}
                    </span>
                  </div>
                  
                  {slot.capacity !== null && slot.current_stock !== null && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-black">
                          {slot.current_stock} / {slot.capacity}
                        </span>
                        {stockPercentage !== null && (
                          <span className="text-sm text-gray-600">
                            {stockPercentage}%
                          </span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            SlotAdapter.isEmpty(slot)
                              ? 'bg-red-500'
                              : SlotAdapter.isLowStock(slot)
                              ? 'bg-yellow-500'
                              : SlotAdapter.isFull(slot)
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${stockPercentage || 0}%` }}
                        />
                      </div>
                    </>
                  )}

                  {(slot.capacity === null || slot.current_stock === null) && (
                    <p className="text-sm text-gray-500 italic">
                      Sin información de stock
                    </p>
                  )}
                </div>

                {/* Product Info */}
                {slot.product_id && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-600">
                      Producto ID: <span className="text-black font-medium">{slot.product_id}</span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleStockUpdateClick(slot)}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Actualizar Stock
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/maquinas/${machineId}/slots/${slot.id}/editar`)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(slot)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Update Modal */}
      {stockUpdateSlot && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Actualizar Stock
            </h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Slot: <span className="font-semibold text-black">{stockUpdateSlot.label}</span> (Código: {stockUpdateSlot.mdb_code})
              </p>
              <div>
                <label htmlFor="newStock" className="block text-sm font-medium text-black mb-2">
                  Nuevo Stock {stockUpdateSlot.capacity !== null && `(Capacidad: ${stockUpdateSlot.capacity})`}
                </label>
                <input
                  type="number"
                  id="newStock"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Number(e.target.value))}
                  min="0"
                  max={stockUpdateSlot.capacity || undefined}
                  className="input-field"
                  disabled={isUpdatingStock}
                />
                {stockUpdateSlot.capacity !== null && newStockValue > stockUpdateSlot.capacity && (
                  <p className="text-sm text-red-600 mt-1">
                    El stock no puede ser mayor que la capacidad
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStockUpdateCancel}
                disabled={isUpdatingStock || isPublishing}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleStockUpdateConfirm}
                disabled={
                  isUpdatingStock ||
                  isPublishing ||
                  (stockUpdateSlot.capacity !== null && newStockValue > stockUpdateSlot.capacity)
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isUpdatingStock || isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPublishing ? 'Sincronizando...' : 'Actualizando...'}
                  </>
                ) : (
                  'Actualizar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el slot {slotToDelete.label || slotToDelete.mdb_code}? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting || isPublishing}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || isPublishing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting || isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPublishing ? 'Sincronizando...' : 'Eliminando...'}
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
