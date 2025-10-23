'use server';

import { cookies } from 'next/headers';

// Interfaces
export interface Usuario {
  id: number | string;
  name: string;
  email: string;
  rut: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  updatedAt?: string;
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

export interface UsersResponse {
  success: boolean;
  users?: Usuario[];
  error?: string;
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export interface UsersFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Server Action para obtener lista de usuarios
export async function getUsersAction(filters?: UsersFilters): Promise<UsersResponse> {
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
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const url = `${apiUrl}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Obteniendo usuarios desde:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log('Error al obtener usuarios:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de usuarios:', data);

    // Mapear datos según la estructura de la API
    const users = mapUsersData(data);

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
      users,
      pagination,
    };

  } catch (error) {
    console.error('Error en getUsersAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para obtener un usuario específico
export async function getUserAction(userId: string | number): Promise<{ success: boolean; user?: Usuario; error?: string }> {
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

    const response = await fetch(`${apiUrl}/users/${userId}`, {
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
    const user = mapUserData(data);

    return {
      success: true,
      user,
    };

  } catch (error) {
    console.error('Error en getUserAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Funciones auxiliares para mapear datos
function mapUsersData(apiData: any): Usuario[] {
  // La API puede devolver los usuarios en diferentes estructuras
  const usersArray = apiData.users || apiData.data || apiData || [];
  
  if (!Array.isArray(usersArray)) {
    console.warn('Los datos de usuarios no están en formato de array:', apiData);
    return [];
  }

  return usersArray.map(mapUserData);
}

function mapUserData(userData: any): Usuario {
  // Para la API actual, asignamos valores por defecto ya que no vienen role, status, etc.
  const defaultRole = 'viewer'; // Rol por defecto
  const defaultStatus = 'active'; // Estado por defecto
  
  return {
    id: userData.id || 0,
    name: userData.name || 'Usuario Sin Nombre',
    email: userData.email || 'sin-email@ejemplo.com',
    rut: userData.rut || 'Sin RUT',
    role: mapUserRole(userData.role || userData.user_type || userData.type || defaultRole),
    status: mapUserStatus(userData.status || userData.is_active || userData.active || defaultStatus),
    permissions: mapUserPermissions(userData.role || userData.user_type || userData.type || defaultRole, userData.permissions),
    lastLogin: userData.last_login || userData.lastLogin || userData.last_login_at || new Date().toISOString(),
    createdAt: userData.created_at || userData.createdAt || userData.date_created || new Date().toISOString(),
    updatedAt: userData.updated_at || userData.updatedAt || userData.date_updated,
  };
}

function mapUserRole(apiRole: any): 'admin' | 'operator' | 'viewer' {
  if (!apiRole) return 'viewer';
  
  const role = apiRole.toString().toLowerCase();
  
  if (role.includes('admin') || role.includes('administrator') || role.includes('super')) {
    return 'admin';
  } else if (role.includes('operator') || role.includes('manager') || role.includes('mod')) {
    return 'operator';
  } else {
    return 'viewer';
  }
}

function mapUserStatus(apiStatus: any): 'active' | 'inactive' {
  if (typeof apiStatus === 'boolean') {
    return apiStatus ? 'active' : 'inactive';
  }
  
  if (typeof apiStatus === 'string') {
    const status = apiStatus.toLowerCase();
    return status === 'active' || status === '1' || status === 'true' ? 'active' : 'inactive';
  }
  
  if (typeof apiStatus === 'number') {
    return apiStatus === 1 ? 'active' : 'inactive';
  }
  
  return 'active'; // Default
}

function mapUserPermissions(apiRole: any, apiPermissions?: any): string[] {
  // Si la API devuelve permisos específicos, usarlos
  if (apiPermissions && Array.isArray(apiPermissions)) {
    return apiPermissions;
  }
  
  // Si no, mapear según el rol
  const role = mapUserRole(apiRole);
  
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete', 'manage_users', 'manage_machines', 'view_reports'];
    case 'operator':
      return ['read', 'write', 'manage_machines', 'view_reports'];
    case 'viewer':
    default:
      return ['read', 'view_reports'];
  }
}
