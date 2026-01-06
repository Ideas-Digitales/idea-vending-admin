import { Slot, SlotApiData, CreateSlot, UpdateSlot } from '../interfaces/slot.interface';

/**
 * SlotAdapter
 * Adaptador para transformar datos de slots entre API y aplicación
 */
export class SlotAdapter {
  /**
   * Convierte datos del API al formato de la aplicación
   */
  static apiToApp(apiData: SlotApiData): Slot {
    return {
      id: apiData.id,
      mdb_code: apiData.mdb_code,
      label: apiData.label,
      product_id: apiData.product_id,
      capacity: apiData.capacity,
      current_stock: apiData.current_stock,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
    };
  }

  /**
   * Convierte datos de la aplicación al formato del API
   */
  static appToApi(slot: Slot): SlotApiData {
    return {
      id: slot.id,
      mdb_code: slot.mdb_code,
      label: slot.label,
      product_id: slot.product_id,
      capacity: slot.capacity,
      current_stock: slot.current_stock,
      created_at: slot.created_at,
      updated_at: slot.updated_at,
    };
  }

  /**
   * Mapea datos de formulario de creación al formato del API
   */
  static mapCreateSlotData(formData: CreateSlot): CreateSlot {
    return {
      mdb_code: formData.mdb_code,
      label: formData.label,
      product_id: formData.product_id,
      capacity: formData.capacity,
      current_stock: formData.current_stock,
    };
  }

  /**
   * Mapea datos de formulario de actualización al formato del API
   * Solo incluye campos que están definidos para permitir actualizaciones parciales
   */
  static mapUpdateSlotData(formData: UpdateSlot): UpdateSlot {
    const updateData: UpdateSlot = {};
    
    if (formData.mdb_code !== undefined) {
      updateData.mdb_code = formData.mdb_code;
    }
    if (formData.label !== undefined) {
      updateData.label = formData.label;
    }
    if (formData.product_id !== undefined) {
      updateData.product_id = formData.product_id;
    }
    if (formData.capacity !== undefined) {
      updateData.capacity = formData.capacity;
    }
    if (formData.current_stock !== undefined) {
      updateData.current_stock = formData.current_stock;
    }
    
    return updateData;
  }

  /**
   * Obtiene el porcentaje de stock de un slot
   */
  static getStockPercentage(slot: Slot): number | null {
    if (slot.capacity === null || slot.current_stock === null || slot.capacity === 0) {
      return null;
    }
    return Math.round((slot.current_stock / slot.capacity) * 100);
  }

  /**
   * Determina si un slot tiene stock bajo (menos del 20%)
   */
  static isLowStock(slot: Slot): boolean {
    const percentage = this.getStockPercentage(slot);
    return percentage !== null && percentage < 20;
  }

  /**
   * Determina si un slot está vacío
   */
  static isEmpty(slot: Slot): boolean {
    return slot.current_stock === 0;
  }

  /**
   * Determina si un slot está lleno
   */
  static isFull(slot: Slot): boolean {
    if (slot.capacity === null || slot.current_stock === null) {
      return false;
    }
    return slot.current_stock >= slot.capacity;
  }
}
