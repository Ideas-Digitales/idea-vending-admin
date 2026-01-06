/**
 * Slot Interfaces
 * Interfaces para gestión de slots (carriles) de máquinas vending
 */

/**
 * Slot - Interfaz principal para un slot de máquina vending
 */
export interface Slot {
  id: number;
  mdb_code: number;
  label: string;
  product_id: number | null;
  capacity: number | null;
  current_stock: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * CreateSlot - Datos para crear un nuevo slot
 */
export interface CreateSlot {
  mdb_code: number;
  label?: string;
  product_id?: number | null;
  capacity?: number | null;
  current_stock?: number | null;
}

/**
 * UpdateSlot - Datos para actualizar un slot existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface UpdateSlot {
  mdb_code?: number;
  label?: string;
  product_id?: number | null;
  capacity?: number | null;
  current_stock?: number | null;
}

/**
 * SlotApiData - Estructura de datos del API
 */
export interface SlotApiData {
  id: number;
  mdb_code: number;
  label: string;
  product_id: number | null;
  capacity: number | null;
  current_stock: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * SlotResponse - Respuesta del API para operaciones de slot
 */
export interface SlotResponse {
  success: boolean;
  slot?: Slot;
  error?: string;
}

/**
 * SlotsListResponse - Respuesta del API para lista de slots
 */
export interface SlotsListResponse {
  success: boolean;
  slots?: Slot[];
  error?: string;
}
