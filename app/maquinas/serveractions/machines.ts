'use server';

import { cookies } from 'next/headers';

// Interfaces
export interface Maquina {
  id: number | string;
  name: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'OutOfService';
  is_enabled: boolean;
  location: string;
  client_id: number | null;
  created_at: string;
  updated_at: string;
  type: string;
  enterprise_id: number;
  connection_status: boolean;
  mqtt_user?: {
    id: number;
    username: string;
    is_superuser: boolean;
    machine_id: number;
    user_id: number | null;
    created_at: string | null;
    updated_at: string | null;
    original_password?: string | null;
    client_id?: string | null;
  };
}

// Server Action para actualizar una máquina
export async function updateMachineAction(machineId: string | number, payload: UpdateMachinePayload): Promise<{ success: boolean; machine?: Maquina; error?: string }>{
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada en variables de entorno' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return { success: false, error: 'Token de autenticación no encontrado' };
    }

    const response = await fetch(`${apiUrl}/machines/${machineId}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const machine = mapMachineData(data.data || data);
    return { success: true, machine };
  } catch (error) {
    console.error('Error en updateMachineAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error de conexión con el servidor' };
  }
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
}

export interface MachinesResponse {
  success: boolean;
  machines?: Maquina[];
  error?: string;
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export interface MachinesFilters {
  search?: string;
  status?: string;
  type?: string;
  is_enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMachinePayload {
  name: string;
  status: 'Inactive' | 'Active' | 'Maintenance' | 'OutOfService';
  is_enabled: boolean;
  location: string;
  type: 'PULSES' | 'MDB' | 'MDB-DEX';
  enterprise_id: number;
}

export interface UpdateMachinePayload {
  name?: string;
  status?: 'Inactive' | 'Active' | 'Maintenance' | 'OutOfService';
  is_enabled?: boolean;
  location?: string;
  type?: 'PULSES' | 'MDB' | 'MDB-DEX';
  enterprise_id?: number;
}

// Server Action (Form) para crear desde FormData (para usar directo en formularios)
export async function createMachineFromForm(formData: FormData) {
  'use server';
  const { redirect } = await import('next/navigation');

  const payload: CreateMachinePayload = {
    name: String(formData.get('name') || '').trim(),
    status: (formData.get('status') as CreateMachinePayload['status']) || 'Inactive',
    is_enabled: (formData.get('is_enabled') as string) === 'on',
    location: String(formData.get('location') || '').trim(),
    type: (formData.get('type') as CreateMachinePayload['type']) || 'MDB',
    enterprise_id: Number(formData.get('enterprise_id') || 0),
  };

  const res = await createMachineAction(payload);
  if (!res.success) {
    throw new Error(res.error || 'No se pudo crear la máquina');
  }

  redirect('/maquinas?page=1');
}

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

    // Mapear datos según la estructura de la API
    const machines = mapMachinesData(data);

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
export async function getMachineAction(machineId: string | number): Promise<{ success: boolean; machine?: Maquina; error?: string }> {
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
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const machine = mapMachineData(data?.data ?? data);

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

// Server Action para crear una máquina
export async function createMachineAction(payload: CreateMachinePayload): Promise<{ success: boolean; machine?: Maquina; error?: string }>{
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return { success: false, error: 'API URL no configurada en variables de entorno' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return { success: false, error: 'Token de autenticación no encontrado' };
    }

    const response = await fetch(`${apiUrl}/machines`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const machine = mapMachineData(data.data || data);

    return { success: true, machine };
  } catch (error) {
    console.error('Error en createMachineAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error de conexión con el servidor' };
  }
}

// Funciones auxiliares para mapear datos
function mapMachinesData(apiData: any): Maquina[] {
  // La API puede devolver las máquinas en diferentes estructuras
  const machinesArray = apiData.data || apiData.machines || apiData || [];
  
  if (!Array.isArray(machinesArray)) {
    console.warn('Los datos de máquinas no están en formato de array:', apiData);
    return [];
  }

  return machinesArray.map(mapMachineData);
}

function mapMachineData(machineData: any): Maquina {
  return {
    id: machineData.id || machineData.machine_id || machineData.machineId || 0,
    name: machineData.name || machineData.machine_name || 'Máquina Sin Nombre',
    status: mapMachineStatus(machineData.status || 'Inactive'),
    is_enabled: Boolean(machineData.is_enabled ?? machineData.enabled ?? true),
    location: machineData.location || machineData.address || 'Ubicación no especificada',
    client_id: machineData.client_id || machineData.clientId || null,
    created_at: machineData.created_at || machineData.createdAt || new Date().toISOString(),
    updated_at: machineData.updated_at || machineData.updatedAt || new Date().toISOString(),
    type: machineData.type || machineData.machine_type || 'MDB-DEX',
    enterprise_id: machineData.enterprise_id || machineData.enterpriseId || 1,
    connection_status: Boolean(machineData.connection_status ?? machineData.connected ?? false),
    mqtt_user: machineData.mqtt_user ? {
      id: Number(machineData.mqtt_user.id),
      username: String(machineData.mqtt_user.username || ''),
      is_superuser: Boolean(machineData.mqtt_user.is_superuser),
      machine_id: Number(machineData.mqtt_user.machine_id),
      user_id: machineData.mqtt_user.user_id !== undefined && machineData.mqtt_user.user_id !== null ? Number(machineData.mqtt_user.user_id) : null,
      created_at: machineData.mqtt_user.created_at ?? null,
      updated_at: machineData.mqtt_user.updated_at ?? null,
      original_password: machineData.mqtt_user.original_password ?? null,
      client_id: machineData.mqtt_user.client_id ?? null,
    } : undefined,
  };
}

function mapMachineStatus(apiStatus: any): 'Active' | 'Inactive' | 'Maintenance' | 'OutOfService' {
  if (!apiStatus) return 'Inactive';
  
  const status = apiStatus.toString().toLowerCase();
  
  if (status.includes('active') || status === 'online' || status === 'running') {
    return 'Active';
  } else if (status.includes('maintenance') || status === 'repair' || status === 'service') {
    return 'Maintenance';
  } else if (status.includes('outofservice') || status.includes('out_of_service') || status.includes('out of service')) {
    return 'OutOfService';
  } else {
    return 'Inactive';
  }
}
