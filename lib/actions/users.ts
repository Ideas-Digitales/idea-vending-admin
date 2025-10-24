'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  UserResponse, 
  UsersResponse, 
  UsersFilters, 
  CreateUser
} from '@/lib/interfaces/user.interface';
import { UserAdapter } from '@/lib/adapters/user.adapter';
import type { ApiUsersResponse } from '@/lib/interfaces/user.interface';
import type { CreateUserFormData } from '@/lib/schemas/user.schema';

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

    const data: ApiUsersResponse = await response.json();
    console.log('Respuesta de usuarios:', data);

    // Mapear datos usando el adaptador
    const users = UserAdapter.apiUsersToApp(data);

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
export async function getUserAction(userId: string | number): Promise<UserResponse> {
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
    const user = UserAdapter.apiToApp(data);

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

// Server Action para crear un nuevo usuario
export async function createUserAction(userData: CreateUserFormData): Promise<UserResponse> {
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

    // Mapear datos del formulario a la interfaz CreateUser
    const createUserData: CreateUser = {
      name: userData.name,
      email: userData.email,
      rut: userData.rut,
      password: userData.password,
      password_confirmation: userData.confirmPassword,
      role: userData.role
    };
    
    console.log('Creando usuario:', { ...createUserData, password: '[HIDDEN]', password_confirmation: '[HIDDEN]' });

    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createUserData),
    });

    if (!response.ok) {
      console.log('Error al crear usuario:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      
      // Manejar errores específicos
      if (response.status === 422) {
        // Errores de validación
        const validationErrors = errorData.errors || {};
        const errorMessages = [];
        
        if (validationErrors.email) {
          errorMessages.push('El email ya está en uso');
        }
        if (validationErrors.rut) {
          errorMessages.push('El RUT ya está registrado');
        }
        if (validationErrors.name) {
          errorMessages.push('El nombre es inválido');
        }
        
        return {
          success: false,
          error: errorMessages.length > 0 
            ? errorMessages.join(', ') 
            : errorData.message || 'Datos de usuario inválidos',
        };
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Usuario creado exitosamente:', data);
    
    // Mapear la respuesta usando el adaptador
    const user = UserAdapter.apiToApp(data.user || data);

    // Revalidar la cache de la página de usuarios para que se actualice automáticamente
    revalidatePath('/usuarios');

    return {
      success: true,
      user,
    };

  } catch (error) {
    console.error('Error en createUserAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}
