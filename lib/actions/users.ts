'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  UserResponse, 
  UsersResponse, 
  UsersFilters, 
  UserFilter,
  CreateUser
} from '@/lib/interfaces/user.interface';
import { UserAdapter } from '@/lib/adapters/user.adapter';
import type { ApiUsersResponse } from '@/lib/interfaces/user.interface';
import type { CreateUserFormData } from '@/lib/schemas/user.schema';

// Helper function to build search payload for POST /users/search
function buildUsersSearchPayload(filters: UsersFilters) {
  const payload: Record<string, unknown> = {
    page: filters.page || 1,
    limit: filters.limit || 20,
  };

  // Add advanced filters if present
  if (filters.filters && filters.filters.length > 0) {
    payload.filters = filters.filters.map(filter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      type: filter.type || 'and',
      ...(filter.nested && { nested: filter.nested })
    }));
  }

  // Add search object if present (searches in name, email, rut fields)
  if (filters.searchObj?.value) {
    payload.search = {
      value: filters.searchObj.value,
      case_sensitive: filters.searchObj.case_sensitive ?? false
    };
  }

  // Handle legacy search parameter
  if (filters.search && !filters.searchObj?.value) {
    payload.search = {
      value: filters.search,
      case_sensitive: false
    };
  }

  console.log('🔍 Users search payload:', JSON.stringify(payload, null, 2));
  
  return payload;
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

    // Use POST search if there's any search term or advanced filters
    const useSearch = filters && (
      filters.searchObj?.value ||
      filters.search ||
      (filters.filters && filters.filters.length > 0)
    );

    let response: Response;

    if (useSearch && filters) {
      // Use POST /users/search for search functionality
      const searchPayload = buildUsersSearchPayload(filters);
      
      response = await fetch(`${apiUrl}/users/search?include=roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchPayload),
      });
    } else {
      // Use simple GET /users for basic requests
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      queryParams.append('include', 'roles');

      const url = `${apiUrl}/users?${queryParams.toString()}`;
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data: ApiUsersResponse = await response.json();

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

    const response = await fetch(`${apiUrl}/users/${userId}?include=roles,permissions,enterprises`, {
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
    console.log('Respuesta del API para usuario individual:', data);
    
    let userData = data;
    if (data.user) {
      userData = data.user;
    } else if (data.data) {
      userData = data.data;
    }
    
    console.log('Datos del usuario con includes:', userData);
    const user = UserAdapter.apiToApp(userData);

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
      role: userData.role,
      status: userData.status
    };
    
    console.log('📝 Datos del formulario recibidos:', userData);
    console.log('📤 Datos a enviar al API:', createUserData);
    
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
      console.log('❌ Error al crear usuario:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Datos de error del API:', errorData);
      
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
    
    console.log('✅ Respuesta exitosa del API:', data);
    
    // Extraer datos del usuario de la respuesta
    let userResponseData = data;
    if (data.data) {
      userResponseData = data.data;
    } else if (data.user) {
      userResponseData = data.user;
    }
    
    console.log('👤 Usuario creado (datos extraídos):', userResponseData);
    
    const user = UserAdapter.apiToApp(userResponseData);

    revalidatePath('/usuarios');

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para actualizar un usuario
export async function updateUserAction(userId: string | number, userData: Record<string, unknown>): Promise<UserResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada en variables de entorno',
      };
    }

    // Validar que los campos requeridos estén presentes
    if (!userData.name || !userData.email || !userData.rut || !userData.role || !userData.status) {
      return {
        success: false,
        error: 'Faltan campos requeridos en los datos del usuario',
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

    // Mapear rol del schema a rol de la API
    const mapSchemaRoleToApiRole = (schemaRole: string): string => {
      switch (schemaRole) {
        case 'admin': return 'admin';
        case 'customer': return 'operator';
        case 'technician': return 'viewer';
        default: return schemaRole;
      }
    };

    // Preparar datos para actualización (sin password si no se proporciona)
    const updateData: Record<string, unknown> = {
      name: userData.name,
      email: userData.email,
      rut: userData.rut,
      role: mapSchemaRoleToApiRole((userData.role as string) || 'admin'),
      status: userData.status
    };

    // Solo incluir password si se proporciona
    if (typeof userData.password === 'string' && userData.password.trim() !== '') {
      updateData.password = userData.password;
      updateData.password_confirmation = userData.confirmPassword;
    }

    
    const response = await fetch(`${apiUrl}/users/${userId}`, {
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

      if (response.status === 404) {
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    // La API puede devolver los datos directamente o dentro de un objeto 'data'
    const userResponseData = data.data || data.user || data;
    const user = UserAdapter.apiToApp(userResponseData);

    revalidatePath('/usuarios');
    revalidatePath(`/usuarios/${userId}`);

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para eliminar un usuario
export async function deleteUserAction(userId: string | number): Promise<{ success: boolean; error?: string }> {
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
          error: 'Usuario no encontrado',
        };
      }
      
      if (response.status === 403) {
        return {
          success: false,
          error: 'No tienes permisos para eliminar este usuario',
        };
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    revalidatePath('/usuarios');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error en deleteUserAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}
