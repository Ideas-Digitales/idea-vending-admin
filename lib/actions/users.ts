'use server';

import { revalidatePath } from 'next/cache';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';
import type {
  UserResponse,
  UsersResponse,
  UsersFilters
} from '@/lib/interfaces';
import type { CreateUser } from '@/lib/interfaces/user.interface';
import { UserAdapter } from '@/lib/adapters/user.adapter';
import type { ApiUsersResponse } from '@/lib/interfaces/user.interface';
import type { CreateUserFormData } from '@/lib/schemas/user.schema';

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    return { success: false, error: error.code === 'TOKEN_EXPIRED' ? TOKEN_EXPIRED_ERROR : error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

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

  // Add scopes if present (e.g. whereRole)
  if (filters.scopes && filters.scopes.length > 0) {
    payload.scopes = filters.scopes;
  }

  return payload;
}

// Server Action para obtener lista de usuarios
export async function getUsersAction(filters?: UsersFilters): Promise<UsersResponse> {
  try {
    // Siempre usar POST /users/search para obtener datos completos (incluyendo role)
    const searchPayload = buildUsersSearchPayload(filters || {});
    const { response } = await authenticatedFetch('/users/search?include=role', {
      method: 'POST',
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data: ApiUsersResponse = await response.json();

    // Diagnostic: log raw role data from first user
    const rawUsers = data.data || data.users || [];
    if (rawUsers.length > 0) {
      const first = rawUsers[0] as unknown as Record<string, unknown>;
      console.log('🔍 [RAW API] first user role fields:', JSON.stringify({ role: first.role, roles: first.roles }));
    }

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
    return handleError(error);
  }
}

// Server Action para obtener un usuario específico
export async function getUserAction(userId: string | number): Promise<UserResponse> {
  try {
    const { response } = await authenticatedFetch(`/users/${userId}?include=roles,permissions,enterprises`, {
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

    let userData = data;
    if (data.user) {
      userData = data.user;
    } else if (data.data) {
      userData = data.data;
    }

    const user = UserAdapter.apiToApp(userData);

    return {
      success: true,
      user,
    };

  } catch (error) {
    return handleError(error);
  }
}

// Server Action para crear un nuevo usuario
export async function createUserAction(userData: CreateUserFormData): Promise<UserResponse> {
  try {
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

    const { response } = await authenticatedFetch('/users', {
      method: 'POST',
      body: JSON.stringify(createUserData),
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

      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Extraer datos del usuario de la respuesta
    let userResponseData = data;
    if (data.data) {
      userResponseData = data.data;
    } else if (data.user) {
      userResponseData = data.user;
    }

    const user = UserAdapter.apiToApp(userResponseData);

    revalidatePath('/usuarios');

    return {
      success: true,
      user,
    };
  } catch (error) {
    return handleError(error);
  }
}

// Server Action para actualizar un usuario
export async function updateUserAction(userId: string | number, userData: Record<string, unknown>): Promise<UserResponse> {
  try {
    // Validar que los campos requeridos estén presentes
    if (!userData.name || !userData.email || !userData.rut || !userData.role || !userData.status) {
      return {
        success: false,
        error: 'Faltan campos requeridos en los datos del usuario',
      };
    }

    // Mapear rol del schema a rol de la API
    const mapSchemaRoleToApiRole = (schemaRole: string): string => {
      return schemaRole;
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

    const { response } = await authenticatedFetch(`/users/${userId}`, {
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
    return handleError(error);
  }
}

// Server Action para eliminar un usuario
export async function deleteUserAction(userId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { response } = await authenticatedFetch(`/users/${userId}`, {
      method: 'DELETE',
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
    return handleError(error);
  }
}
