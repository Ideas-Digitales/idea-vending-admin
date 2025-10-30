'use server';

import { cookies } from 'next/headers';
import {
  Enterprise,
  EnterprisesResponse,
  EnterprisesFilters,
  EnterpriseResponse,
  PaginationLinks,
  PaginationMeta
} from '../interfaces/enterprise.interface';
import { EnterpriseAdapter } from '../adapters/enterprise.adapter';
import { createEnterpriseSchema, updateEnterpriseSchema, CreateEnterpriseFormData, UpdateEnterpriseFormData } from '../schemas/enterprise.schema';

// Server Action para obtener lista de empresas
export async function getEnterprisesAction(filters?: EnterprisesFilters): Promise<EnterprisesResponse> {
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

    // Si hay búsqueda, usar POST con payload
    if (filters?.search) {
      const payload = {
        filters: [
          {
            field: "name",
            operator: "ilike",
            value: `%${filters.search}%`
          },
          {
            type: "or",
            field: "rut",
            operator: "ilike",
            value: `%${filters.search}%`
          }
        ],
        ...(filters.include && filters.include.length > 0 && {
          includes: filters.include.map(relation => ({ relation }))
        })
      };

      // Query parameters solo para paginación
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${apiUrl}/enterprises/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('❌ Search Error response:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Search Error data:', errorData);
        return {
          success: false,
          error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      const enterprises = EnterpriseAdapter.apiEnterprisesToApp(data);
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
          per_page: data.meta.per_page,
          to: data.meta.to,
          total: data.meta.total,
          path: data.meta.path || '',
          links: data.meta.links || [],
        }
      } : undefined;

      return {
        success: true,
        enterprises,
        pagination,
      };
    }

    // Si no hay búsqueda, usar GET tradicional
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.include && filters.include.length > 0) {
      queryParams.append('include', filters.include.join(','));
    }

    const url = `${apiUrl}/enterprises${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error data:', errorData);
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Mapear datos según la estructura de la API
    const enterprises = EnterpriseAdapter.apiEnterprisesToApp(data);

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
      enterprises,
      pagination,
    };

  } catch (error) {
    console.error('Error en getEnterprisesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para obtener una empresa específica
export async function getEnterpriseAction(enterpriseId: string | number): Promise<EnterpriseResponse> {
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

    const response = await fetch(`${apiUrl}/enterprises/${enterpriseId}`, {
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
    
    // La API puede devolver la empresa directamente o dentro de un objeto "data"
    const enterpriseData = data.data || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseData);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('Error en getEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para crear una nueva empresa
export async function createEnterpriseAction(enterpriseData: CreateEnterpriseFormData): Promise<EnterpriseResponse> {
  try {
    // Validar datos con Zod
    const validationResult = createEnterpriseSchema.safeParse(enterpriseData);
    
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

    console.log('Creando empresa con datos:', validatedData);

    const response = await fetch(`${apiUrl}/enterprises`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de creación de empresa:', data);
    
    // La API puede devolver la empresa directamente o dentro de un objeto "data"
    const enterpriseData_response = data.data || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseData_response);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('Error en createEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para actualizar una empresa
export async function updateEnterpriseAction(
  enterpriseId: string | number,
  enterpriseData: UpdateEnterpriseFormData
): Promise<EnterpriseResponse> {
  try {
    // Validar datos con Zod
    const validationResult = updateEnterpriseSchema.safeParse(enterpriseData);
    
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


    const response = await fetch(`${apiUrl}/enterprises/${enterpriseId}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    // La API puede devolver la empresa directamente o dentro de un objeto "data"
    const enterpriseData_response = data.data || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseData_response);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('Error en updateEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para eliminar una empresa
export async function deleteEnterpriseAction(enterpriseId: string | number): Promise<{ success: boolean; error?: string }> {
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

    console.log('Eliminando empresa:', enterpriseId);

    const response = await fetch(`${apiUrl}/enterprises/${enterpriseId}`, {
      method: 'DELETE',
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

    console.log('Empresa eliminada exitosamente');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error en deleteEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}