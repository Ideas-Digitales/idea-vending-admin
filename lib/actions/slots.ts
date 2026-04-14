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
import { handleActionError } from '../utils/actionError';
import { httpErrorMessage } from '../utils/httpError';

/**
 * Obtiene todos los slots de una máquina
 */
export async function getSlotsAction(machineId: string | number): Promise<SlotsListResponse> {
  try {
    const { response } = await authenticatedFetch(`/machines/${machineId}/slots?include=product&limit=200`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: false, error: httpErrorMessage(response.status) };
    }

    const data = await response.json();
    const slotsArray = data.data || [];
    const slots = slotsArray.map(SlotAdapter.apiToApp);

    return { success: true, slots };
  } catch (error) {
    return handleActionError(error);
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
      return { success: false, error: httpErrorMessage(response.status) };
    }

    const data = await response.json();
    const slotResponseData = data.data || data;
    const slot = SlotAdapter.apiToApp(slotResponseData);

    return { success: true, slot };
  } catch (error) {
    return handleActionError(error);
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

    const { response } = await authenticatedFetch(`/machines/${machineId}/slots/${slotId}?include=product`, {
      method: 'PATCH',
      body: JSON.stringify(updateSlotData),
    });

    if (!response.ok) {
      return { success: false, error: httpErrorMessage(response.status) };
    }

    const data = await response.json();
    const slotResponseData = data.data || data;
    const slot = SlotAdapter.apiToApp(slotResponseData);

    return { success: true, slot };
  } catch (error) {
    return handleActionError(error);
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
      return { success: false, error: httpErrorMessage(response.status) };
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
