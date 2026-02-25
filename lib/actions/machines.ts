'use server';

import { revalidatePath } from 'next/cache';
import {
  MachinesResponse,
  MachineResponse,
  MachinesFilters,
  CreateMachine,
  UpdateMachine
} from '@/lib/interfaces/machine.interface';
import { MachineAdapter } from '@/lib/adapters/machine.adapter';
import { createMachineSchema, updateMachineSchema, CreateMachineFormData, UpdateMachineFormData } from '@/lib/schemas/machine.schema';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';

// Re-export types for backward compatibility
export type { Machine as Maquina } from '@/lib/interfaces/machine.interface';

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'NO_TOKEN') {
      return { success: false, error: TOKEN_EXPIRED_ERROR };
    }
    return { success: false, error: error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

// Server Action para obtener lista de máquinas
export async function getMachinesAction(filters?: MachinesFilters): Promise<MachinesResponse> {
  try {
    // Construir query parameters
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.enterprise_id) queryParams.append('enterprise_id', filters.enterprise_id.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const path = `/machines${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const { response } = await authenticatedFetch(path, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Mapear datos usando el adaptador
    const machines = MachineAdapter.apiMachinesToApp(data);

    // Extraer información de paginación
    const pagination = data.links && data.meta ? {
      links: {
        first: data.links.first,
        last: data.links.last,
        prev: data.links.prev,
        next: data.links.next,
      },
      meta: {
        current_page: data.meta.current_page,
        from: data.meta.from,
        last_page: data.meta.last_page,
        path: data.meta.path,
        per_page: data.meta.per_page,
        to: data.meta.to,
        total: data.meta.total,
        links: data.meta.links,
      }
    } : undefined;

    return {
      success: true,
      machines,
      pagination,
    };

  } catch (error) {
    return handleError(error);
  }
}

// Server Action para obtener una máquina específica
export async function getMachineAction(machineId: string | number, options: { include?: string } = {}): Promise<MachineResponse> {
  try {
    const path = `/machines/${machineId}${options.include ? `?include=${options.include}` : ''}`;

    const { response } = await authenticatedFetch(path, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching machine:', errorData);
      return { success: false, error: errorData.message || 'Error fetching machine' };
    }

    const data = await response.json();

    // La API devuelve la máquina dentro de un objeto "data"
    const machineData = data.data || data;
    const machine = MachineAdapter.apiToApp(machineData);

    return {
      success: true,
      machine,
    };

  } catch (error) {
    return handleError(error);
  }
}

// Server Action para crear una nueva máquina
export async function createMachineAction(machineData: CreateMachineFormData): Promise<MachineResponse> {
  try {
    // Validar datos con Zod
    const validationResult = createMachineSchema.safeParse(machineData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return {
        success: false,
        error: `Datos inválidos: ${errors}`,
      };
    }

    const validatedData = validationResult.data;

    // Mapear datos del formulario al formato de la API
    const createMachineData: CreateMachine = {
      name: validatedData.name,
      location: validatedData.location,
      type: validatedData.type,
      enterprise_id: validatedData.enterprise_id,
      client_id: validatedData.client_id
    };

    const { response } = await authenticatedFetch('/machines', {
      method: 'POST',
      body: JSON.stringify(createMachineData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Manejar errores específicos
      if (response.status === 422) {
        // Errores de validación
        const validationErrors = errorData.errors || {};
        const errorMessages = [];

        if (validationErrors.name) {
          errorMessages.push('El nombre ya está en uso');
        }
        if (validationErrors.location) {
          errorMessages.push('La ubicación es inválida');
        }
        if (validationErrors.enterprise_id) {
          errorMessages.push('La empresa es inválida');
        }

        return {
          success: false,
          error: errorMessages.length > 0
            ? errorMessages.join(', ')
            : errorData.message || 'Datos de máquina inválidos',
        };
      }

      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    const machine = MachineAdapter.apiToApp(data.machine || data);

    revalidatePath('/maquinas');

    return {
      success: true,
      machine,
    };
  } catch (error) {
    return handleError(error);
  }
}

// Server Action para actualizar una máquina
export async function updateMachineAction(machineId: string | number, machineData: UpdateMachineFormData): Promise<MachineResponse> {
  try {
    // Validar datos con Zod
    const validationResult = updateMachineSchema.safeParse(machineData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return {
        success: false,
        error: `Datos inválidos: ${errors}`,
      };
    }

    const validatedData = validationResult.data;

    // Preparar datos para actualización
    const updateData: UpdateMachine = {
      name: validatedData.name,
      location: validatedData.location,
      type: validatedData.type,
      status: validatedData.status,
      client_id: validatedData.client_id
    };

    // Filtrar valores undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateMachine] === undefined) {
        delete updateData[key as keyof UpdateMachine];
      }
    });

    const { response } = await authenticatedFetch(`/machines/${machineId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Manejar errores específicos
      if (response.status === 422) {
        // Errores de validación
        const validationErrors = errorData.errors || {};
        const errorMessages = [];

        if (validationErrors.name) {
          errorMessages.push('El nombre ya está en uso');
        }
        if (validationErrors.location) {
          errorMessages.push('La ubicación es inválida');
        }

        return {
          success: false,
          error: errorMessages.length > 0
            ? errorMessages.join(', ')
            : errorData.message || 'Datos de máquina inválidos',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'Máquina no encontrada',
        };
      }

      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // La API puede devolver los datos directamente o dentro de un objeto 'data'
    const machineResponseData = data.data || data.machine || data;
    const machine = MachineAdapter.apiToApp(machineResponseData);

    revalidatePath('/maquinas');
    revalidatePath(`/maquinas/${machineId}`);

    return {
      success: true,
      machine,
    };
  } catch (error) {
    return handleError(error);
  }
}

// Server Action para eliminar una máquina
export async function deleteMachineAction(machineId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { response } = await authenticatedFetch(`/machines/${machineId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Manejar errores específicos
      if (response.status === 404) {
        return {
          success: false,
          error: 'Máquina no encontrada',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'No tienes permisos para eliminar esta máquina',
        };
      }

      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    revalidatePath('/maquinas');

    return {
      success: true,
    };

  } catch (error) {
    return handleError(error);
  }
}
