'use server';

import { cookies } from 'next/headers';
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

// Re-export types for backward compatibility
export type { Machine as Maquina } from '@/lib/interfaces/machine.interface';

// Server Action para obtener lista de máquinas
export async function getMachinesAction(filters?: MachinesFilters): Promise<MachinesResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Obtener token de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    // Construir query parameters
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.is_enabled !== undefined) queryParams.append('is_enabled', filters.is_enabled.toString());
    if (filters?.enterprise_id) queryParams.append('enterprise_id', filters.enterprise_id.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const url = `${apiUrl}/machines${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('Obteniendo máquinas desde:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log('Error al obtener máquinas:', response.status, response.statusText);

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de máquinas:', data);

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
    console.error('Error en getMachinesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para obtener una máquina específica
export async function getMachineAction(machineId: string | number, options: { include?: string } = {}): Promise<MachineResponse> {
  try {
    console.log('getMachineAction llamada con ID:', machineId);
    console.log('Tipo de machineId:', typeof machineId);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('API URL:', apiUrl);

    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Obtener token de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      console.log('Token no encontrado');
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    const url = `${apiUrl}/machines/${machineId}${options.include ? `?include=${options.include}` : ''}`;
    console.log('Haciendo petición a:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Respuesta status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching machine:', errorData);
      return { success: false, error: errorData.message || 'Error fetching machine' };
    }

    const data = await response.json();
    console.log('Datos recibidos de la API:', data);

    // La API devuelve la máquina dentro de un objeto "data"
    const machineData = data.data || data;
    console.log('Datos de máquina procesados:', machineData);
    
    const machine = MachineAdapter.apiToApp(machineData);
    console.log('Máquina adaptada:', machine);

    return {
      success: true,
      machine,
    };

  } catch (error) {
    console.error('Error en getMachineAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Obtener token de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    // Mapear datos del formulario al formato de la API
    const createMachineData: CreateMachine = {
      name: validatedData.name,
      location: validatedData.location,
      type: validatedData.type,
      status: validatedData.status,
      is_enabled: validatedData.is_enabled,
      enterprise_id: validatedData.enterprise_id,
      client_id: validatedData.client_id
    };

    const response = await fetch(`${apiUrl}/machines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createMachineData),
    });

    if (!response.ok) {
      console.log('Error al crear máquina:', response.status, response.statusText);

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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Obtener token de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    // Preparar datos para actualización
    const updateData: UpdateMachine = {
      name: validatedData.name,
      location: validatedData.location,
      type: validatedData.type,
      status: validatedData.status,
      is_enabled: validatedData.is_enabled,
      client_id: validatedData.client_id
    };

    // Filtrar valores undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateMachine] === undefined) {
        delete updateData[key as keyof UpdateMachine];
      }
    });

    const response = await fetch(`${apiUrl}/machines/${machineId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para eliminar una máquina
export async function deleteMachineAction(machineId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Obtener token de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    const response = await fetch(`${apiUrl}/machines/${machineId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
    console.error('Error en deleteMachineAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}