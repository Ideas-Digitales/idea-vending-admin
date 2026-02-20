import { useMachineStore } from './machineStore';
import { useProductStore } from './productStore';
import { useUserStore } from './userStore';
import { usePaymentStore } from './paymentStore';

const PERSISTED_STORE_KEYS = [
  'machine-store',
  'product-store',
  'user-store',
  'payment-store',
];

/**
 * Limpia todos los stores de datos al cerrar sesión:
 * - Resetea el estado en memoria de cada store
 * - Elimina las claves de localStorage para evitar que el próximo usuario
 *   vea datos de la sesión anterior
 */
export function resetAllDataStores() {
  useMachineStore.getState().reset();
  useProductStore.getState().reset();
  useUserStore.getState().reset();
  usePaymentStore.getState().reset();

  if (typeof window !== 'undefined') {
    PERSISTED_STORE_KEYS.forEach((key) => localStorage.removeItem(key));
  }
}
