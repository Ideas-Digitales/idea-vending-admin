'use server';

import { cookies } from 'next/headers';

// Interfaces
export interface Maquina {
  id: number | string;
  name: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  is_enabled: boolean;
  location: string;
  client_id: number | null;
  created_at: string;
  updated_at: string;
  type: string;
  enterprise_id: number;
  connection_status: boolean;
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
    const machine = mapMachineData(data);

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
  };
}

function mapMachineStatus(apiStatus: any): 'Active' | 'Inactive' | 'Maintenance' {
  if (!apiStatus) return 'Inactive';
  
  const status = apiStatus.toString().toLowerCase();
  
  if (status.includes('active') || status === 'online' || status === 'running') {
    return 'Active';
  } else if (status.includes('maintenance') || status === 'repair' || status === 'service') {
    return 'Maintenance';
  } else {
    return 'Inactive';
  }
}
