'use server';

import { cookies } from 'next/headers';
import {
  Enterprise,
  EnterprisesResponse,
  EnterpriseResponse,
  EnterprisesFilters,
  CreateEnterpriseData,
  UpdateEnterpriseData,
} from '../interfaces/enterprise.interface';
import { EnterpriseAdapter } from '../adapters/enterprise.adapter';
import { 
  createEnterpriseSchema, 
  updateEnterpriseSchema,
  CreateEnterpriseFormData,
  UpdateEnterpriseFormData 
} from '../schemas/enterprise.schema';

/**
 * Obtener lista de empresas con búsqueda
 */
export async function getEnterprisesAction(filters?: EnterprisesFilters): Promise<EnterprisesResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    // Si hay búsqueda, usar POST /enterprises/search
    if (filters?.search && filters.search.trim()) {
      return await searchEnterprisesAction(filters);
    }

    // Si no hay búsqueda, usar GET /enterprises
    const url = new URL(`${apiUrl}/enterprises`);
    if (filters?.page) url.searchParams.append('page', filters.page.toString());
    if (filters?.limit) url.searchParams.append('limit', filters.limit.toString());

    console.log('🏢 Obteniendo empresas:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('✅ Respuesta del API de empresas:', data);

    // Extraer empresas y paginación según la estructura real del API
    const enterprisesData = data.data || [];
    const enterprises = EnterpriseAdapter.apiEnterprisesToApp(enterprisesData);

    return {
      success: true,
      enterprises,
      pagination: {
        meta: data.meta || {},
        links: data.links || {},
      },
    };

  } catch (error) {
    console.error('❌ Error en getEnterprisesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Buscar empresas usando POST /enterprises/search
 */
export async function searchEnterprisesAction(filters: EnterprisesFilters): Promise<EnterprisesResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    // Construir payload para búsqueda
    const searchPayload = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      filters: [
        {
          field: 'name',
          operator: 'ilike',
          value: `%${filters.search}%`
        }
      ]
    };

    console.log('🔍 Buscando empresas:', searchPayload);

    const response = await fetch(`${apiUrl}/enterprises/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      console.error('❌ Error en búsqueda de empresas:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('✅ Respuesta de búsqueda de empresas:', data);

    // Extraer empresas y paginación según la estructura real del API
    const enterprisesData = data.data || [];
    const enterprises = EnterpriseAdapter.apiEnterprisesToApp(enterprisesData);

    return {
      success: true,
      enterprises,
      pagination: {
        meta: data.meta || {},
        links: data.links || {},
      },
    };

  } catch (error) {
    console.error('❌ Error en searchEnterprisesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Obtener una empresa por ID
 */
export async function getEnterpriseAction(enterpriseId: string | number): Promise<EnterpriseResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    console.log('🏢 Obteniendo empresa:', enterpriseId);

    const response = await fetch(`${apiUrl}/enterprises/${enterpriseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('✅ Respuesta del API de empresa:', data);

    const enterpriseData = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseData);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('❌ Error en getEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Crear una nueva empresa
 */
export async function createEnterpriseAction(enterpriseData: CreateEnterpriseFormData): Promise<EnterpriseResponse> {
  try {
    console.log('🏢 Creando empresa:', enterpriseData);

    // Validar datos con Zod
    const validationResult = createEnterpriseSchema.safeParse(enterpriseData);
    if (!validationResult.success) {
      console.error('❌ Error de validación:', validationResult.error.issues);
      return {
        success: false,
        error: validationResult.error.issues.map((e: any) => e.message).join(', '),
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    const payload = EnterpriseAdapter.formToApi(validationResult.data);
    console.log('📤 Payload a enviar:', payload);

    const response = await fetch(`${apiUrl}/enterprises`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta del API:', response.status, response.statusText);
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Error del servidor: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ Empresa creada:', data);

    const enterpriseResult = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseResult);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('❌ Error en createEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Actualizar una empresa
 */
export async function updateEnterpriseAction(
  enterpriseId: string | number, 
  enterpriseData: UpdateEnterpriseFormData
): Promise<EnterpriseResponse> {
  try {
    console.log('🏢 Actualizando empresa:', enterpriseId, enterpriseData);

    // Validar datos con Zod
    const validationResult = updateEnterpriseSchema.safeParse(enterpriseData);
    if (!validationResult.success) {
      console.error('❌ Error de validación:', validationResult.error.issues);
      return {
        success: false,
        error: validationResult.error.issues.map((e: any) => e.message).join(', '),
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

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
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta del API:', response.status, response.statusText);
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Error del servidor: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ Empresa actualizada:', data);

    const enterpriseResult = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseResult);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    console.error('❌ Error en updateEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Eliminar una empresa
 */
export async function deleteEnterpriseAction(enterpriseId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🏢 Eliminando empresa:', enterpriseId);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL no configurada',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Token de autenticación no encontrado',
      };
    }

    const response = await fetch(`${apiUrl}/enterprises/${enterpriseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    console.log('✅ Empresa eliminada exitosamente');

    return {
      success: true,
    };

  } catch (error) {
    console.error('❌ Error en deleteEnterpriseAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}
