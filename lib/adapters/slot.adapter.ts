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
      column: apiData.column,
      row: apiData.row,
      product_id: apiData.product_id,
      product: apiData.product
        ? {
            id: apiData.product.id ?? apiData.product.product_id ?? apiData.product_id ?? 0,
            name: apiData.product.name ?? apiData.product.product_name ?? 'Producto Sin Nombre',
            image: apiData.product.image ?? null,
          }
        : null,
      manage_stock: apiData.manage_stock ?? null,
      capacity: apiData.capacity,
      current_stock: apiData.current_stock,
      x: apiData.x,
      y: apiData.y,
      width: apiData.width,
      height: apiData.height,
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
      column: slot.column,
      row: slot.row,
      product_id: slot.product_id,
      product: slot.product
        ? {
            id: slot.product.id,
            name: slot.product.name,
          }
        : null,
      manage_stock: slot.manage_stock,
      capacity: slot.capacity,
      current_stock: slot.current_stock,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      created_at: slot.created_at,
      updated_at: slot.updated_at,
    };
  }

  static mapCreateSlotData(formData: CreateSlot): CreateSlot {
    return formData;
  }

  /**
   * Solo incluye campos definidos para permitir actualizaciones parciales (PATCH)
   */
  static mapUpdateSlotData(formData: UpdateSlot): UpdateSlot {
    return Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== undefined),
    ) as UpdateSlot;
  }

  /**
   * Obtiene el porcentaje de stock de un slot
   */
  static getStockPercentage(slot: Slot): number | null {
    if (!this.tracksStock(slot) || slot.capacity === null || slot.current_stock === null || slot.capacity === 0) {
      return null;
    }
    return Math.round((slot.current_stock / slot.capacity) * 100);
  }

  static tracksStock(slot: Pick<Slot, 'manage_stock'>, machineManageStock = true): boolean {
    return slot.manage_stock ?? machineManageStock;
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
    return this.tracksStock(slot) && slot.current_stock === 0;
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
