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

async function fetchWithTimeout(url: string, options: any, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Helper para construir el body de búsqueda del endpoint POST /machines/search
function buildMachinesSearchPayload(filters: MachinesFilters | undefined) {
  const hasSearch = !!filters?.search;
  const hasStatus = filters?.status !== undefined && filters?.status !== '';
  const hasType = filters?.type !== undefined && filters?.type !== '';
  const hasEnabled = filters?.is_enabled !== undefined;

  const payload: any = { filters: [] as any[] };

  // search: { value, case_sensitive }
  if (hasSearch) {
    payload.search = {
      value: String(filters!.search),
      case_sensitive: false,
    };
  }

  // filters: [{ field, operator, value }]
  const filterItems: any[] = [];
  if (hasStatus) {
    filterItems.push({ field: 'status', operator: '=', value: String(filters!.status) });
  }
  if (hasType) {
    filterItems.push({ field: 'type', operator: '=', value: String(filters!.type) });
  }
  if (hasEnabled) {
    // API espera string "0" | "1"
    filterItems.push({ field: 'is_enabled', operator: '=', value: filters!.is_enabled ? '1' : '0' });
  }
  // Siempre enviar filters (vacío o con items)
  payload.filters = filterItems;

  return payload;
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

    // Query params solo para paginación
    const qp = new URLSearchParams();
    if (filters?.page) qp.append('page', filters.page.toString());
    if (filters?.limit) qp.append('limit', filters.limit.toString());

    // Detectar si debemos usar POST /machines/search
    const shouldUseSearch = Boolean(
      (filters?.search && filters.search.trim() !== '') ||
      (filters?.status && filters.status !== '') ||
      (filters?.type && filters.type !== '') ||
      (filters?.is_enabled !== undefined)
    );

    let response: Response;
    if (shouldUseSearch) {
      const url = `${apiUrl}/machines/search${qp.toString() ? `?${qp.toString()}` : ''}`;
      const body = buildMachinesSearchPayload(filters);
      console.log('Buscando máquinas (POST):', url, body);
      response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Reintento si el backend devuelve 500 y hay término de búsqueda
      if (!response.ok && response.status >= 500 && filters?.search) {
        try {
          const retryBody = { ...body, search: { value: String(filters.search), case_sensitive: true } };
          console.log('Reintentando búsqueda con case_sensitive=true:', url, retryBody);
          response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(retryBody),
          });
        } catch (_) {
          // Ignorar errores del reintento; se manejarán abajo
        }
      }
    } else {
      const url = `${apiUrl}/machines${qp.toString() ? `?${qp.toString()}` : ''}`;
      console.log('Obteniendo máquinas (GET):', url);
      response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (!response.ok) {
      console.log('Error al obtener máquinas:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de máquinas (raw):', data);

    // Mapear datos según la estructura de la API
    const machines = mapMachinesData(data);
    try {
      const rawArray = (data && (Array.isArray(data) ? data : (data.data || data.machines))) || [];
      console.log('Debug machines -> raw[0..2]:', Array.isArray(rawArray) ? rawArray.slice(0, 3) : rawArray);
      console.log('Debug machines -> mapped[0..2]:', machines.slice(0, 3));
    } catch {}

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
  const isEnabledVal = (() => {
    const v = machineData.is_enabled ?? machineData.enabled;
    if (typeof v === 'string') {
      if (v === '1') return true;
      if (v === '0') return false;
      return v.toLowerCase() === 'true';
    }
    if (typeof v === 'number') {
      return v === 1;
    }
    if (typeof v === 'boolean') {
      return v;
    }
    return false;
  })();

  return {
    id: machineData.id || machineData.machine_id || machineData.machineId || 0,
    name: machineData.name || machineData.machine_name || 'Máquina Sin Nombre',
    status: mapMachineStatus(machineData.status || 'Inactive'),
    is_enabled: isEnabledVal,
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

  const s = apiStatus.toString().trim().toLowerCase();

  // Activa
  if (s === 'active' || s === 'online' || s === 'running') return 'Active';

  // Inactiva
  if (s === 'inactive' || s === 'offline' || s === 'stopped') return 'Inactive';

  // Mantenimiento
  if (s === 'maintenance' || s === 'repair' || s === 'service' || s.includes('maintenance')) return 'Maintenance';

  // Fuera de servicio
  if (s === 'outofservice' || s === 'out_of_service' || s === 'out of service') return 'OutOfService';

  return 'Inactive';
}
