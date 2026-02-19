'use server';

import { SlotAdapter } from '../adapters/slot.adapter';
import {
  SlotResponse,
  SlotsListResponse,
  CreateSlot,
  UpdateSlot,
} from '../interfaces/slot.interface';
import { createSlotSchema, updateSlotSchema } from '../schemas/slot.schema';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    return { success: false, error: error.code === 'TOKEN_EXPIRED' ? TOKEN_EXPIRED_ERROR : error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

/**
 * Obtiene todos los slots de una máquina
 */
export async function getSlotsAction(machineId: string | number): Promise<SlotsListResponse> {
  try {
    const { response } = await authenticatedFetch(`/machines/${machineId}/slots`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const slotsArray = data.data || [];
    const slots = slotsArray.map(SlotAdapter.apiToApp);

    return { success: true, slots };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Crea un nuevo slot en una máquina
 */
export async function createSlotAction(
  machineId: string | number,
  slotData: CreateSlot
): Promise<SlotResponse> {
  try {
    const validationResult = createSlotSchema.safeParse(slotData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => issue.message).join(', ');
      return { success: false, error: errors };
    }

    const createSlotData = SlotAdapter.mapCreateSlotData(validationResult.data);

    const { response } = await authenticatedFetch(`/machines/${machineId}/slots`, {
      method: 'POST',
      body: JSON.stringify(createSlotData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const slotResponseData = data.data || data;
    const slot = SlotAdapter.apiToApp(slotResponseData);

    return { success: true, slot };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Actualiza un slot existente
 */
export async function updateSlotAction(
  machineId: string | number,
  slotId: string | number,
  slotData: UpdateSlot
): Promise<SlotResponse> {
  try {
    const validationResult = updateSlotSchema.safeParse(slotData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => issue.message).join(', ');
      return { success: false, error: errors };
    }

    const updateSlotData = SlotAdapter.mapUpdateSlotData(validationResult.data);

    const { response } = await authenticatedFetch(`/machines/${machineId}/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateSlotData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const slotResponseData = data.data || data;
    const slot = SlotAdapter.apiToApp(slotResponseData);

    return { success: true, slot };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Elimina un slot
 */
export async function deleteSlotAction(
  machineId: string | number,
  slotId: string | number
): Promise<SlotResponse> {
  try {
    const { response } = await authenticatedFetch(`/machines/${machineId}/slots/${slotId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
