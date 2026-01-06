'use server';

import { cookies } from 'next/headers';
import { SlotAdapter } from '../adapters/slot.adapter';
import { 
  SlotResponse, 
  SlotsListResponse,
  CreateSlot,
  UpdateSlot,
} from '../interfaces/slot.interface';
import { createSlotSchema, updateSlotSchema } from '../schemas/slot.schema';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Obtiene todos los slots de una máquina
 * GET /machines/{machine}/slots
 */
export async function getSlotsAction(machineId: string | number): Promise<SlotsListResponse> {
  try {
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No hay token de autenticación' };
    }

    console.log('Obteniendo slots de la máquina:', machineId);

    const response = await fetch(`${apiUrl}/machines/${machineId}/slots`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error al obtener slots:', response.status, response.statusText);
      console.log('Datos de error:', errorData);
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de slots:', data);

    // El API devuelve un objeto con { data: [], meta: {}, links: {} }
    const slotsArray = data.data || [];
    const slots = slotsArray.map(SlotAdapter.apiToApp);

    return {
      success: true,
      slots,
    };
  } catch (error) {
    console.error('Error en getSlotsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Crea un nuevo slot en una máquina
 * POST /machines/{machine}/slots
 */
export async function createSlotAction(
  machineId: string | number,
  slotData: CreateSlot
): Promise<SlotResponse> {
  try {
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No hay token de autenticación' };
    }

    // Validar datos con Zod
    const validationResult = createSlotSchema.safeParse(slotData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => issue.message).join(', ');
      return { success: false, error: errors };
    }

    const validatedData = validationResult.data;
    const createSlotData = SlotAdapter.mapCreateSlotData(validatedData);

    console.log('Creando slot en máquina:', machineId, createSlotData);

    const response = await fetch(`${apiUrl}/machines/${machineId}/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createSlotData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error al crear slot:', response.status, response.statusText);
      console.log('Datos de error:', errorData);
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de creación de slot:', data);

    // Extraer slot de la respuesta
    let slotResponseData = data;
    if (data.data) {
      slotResponseData = data.data;
    }

    const slot = SlotAdapter.apiToApp(slotResponseData);

    return {
      success: true,
      slot,
    };
  } catch (error) {
    console.error('Error en createSlotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un slot existente
 * PATCH /machines/{machine}/slots/{slot}
 */
export async function updateSlotAction(
  machineId: string | number,
  slotId: string | number,
  slotData: UpdateSlot
): Promise<SlotResponse> {
  try {
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No hay token de autenticación' };
    }

    // Validar datos con Zod
    const validationResult = updateSlotSchema.safeParse(slotData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => issue.message).join(', ');
      return { success: false, error: errors };
    }

    const validatedData = validationResult.data;
    const updateSlotData = SlotAdapter.mapUpdateSlotData(validatedData);

    console.log('Actualizando slot:', machineId, slotId, updateSlotData);

    const response = await fetch(`${apiUrl}/machines/${machineId}/slots/${slotId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateSlotData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error al actualizar slot:', response.status, response.statusText);
      console.log('Datos de error:', errorData);
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de actualización de slot:', data);

    // Extraer slot de la respuesta
    let slotResponseData = data;
    if (data.data) {
      slotResponseData = data.data;
    }

    const slot = SlotAdapter.apiToApp(slotResponseData);

    return {
      success: true,
      slot,
    };
  } catch (error) {
    console.error('Error en updateSlotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un slot
 * DELETE /machines/{machine}/slots/{slot}
 */
export async function deleteSlotAction(
  machineId: string | number,
  slotId: string | number
): Promise<SlotResponse> {
  try {
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No hay token de autenticación' };
    }

    console.log('Eliminando slot:', machineId, slotId);

    const response = await fetch(`${apiUrl}/machines/${machineId}/slots/${slotId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error al eliminar slot:', response.status, response.statusText);
      console.log('Datos de error:', errorData);
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    console.log('Slot eliminado exitosamente');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error en deleteSlotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
