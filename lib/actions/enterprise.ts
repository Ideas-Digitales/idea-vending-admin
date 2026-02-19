'use server';

import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';
import {
  EnterpriseResponse,
  EnterprisesResponse,
  EnterprisesFilters,
} from '../interfaces/enterprise.interface';
import { EnterpriseAdapter } from '../adapters/enterprise.adapter';
import {
  createEnterpriseSchema,
  updateEnterpriseSchema,
  CreateEnterpriseFormData,
  UpdateEnterpriseFormData
} from '../schemas/enterprise.schema';

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    return { success: false, error: error.code === 'TOKEN_EXPIRED' ? TOKEN_EXPIRED_ERROR : error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

/**
 * Obtener lista de empresas con búsqueda
 */
export async function getEnterprisesAction(filters?: EnterprisesFilters): Promise<EnterprisesResponse> {
  try {
    // Si hay búsqueda, usar POST /enterprises/search
    if (filters?.search && filters.search.trim()) {
      return await searchEnterprisesAction(filters);
    }

    // Si no hay búsqueda, usar GET /enterprises
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    const path = `/enterprises${query ? `?${query}` : ''}`;

    const { response } = await authenticatedFetch(path);

    if (!response.ok) {
      console.error('Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

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
    return handleError(error);
  }
}

/**
 * Buscar empresas usando POST /enterprises/search
 */
export async function searchEnterprisesAction(filters: EnterprisesFilters): Promise<EnterprisesResponse> {
  try {
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

    const { response } = await authenticatedFetch('/enterprises/search', {
      method: 'POST',
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      console.error('Error en búsqueda de empresas:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

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
    return handleError(error);
  }
}

/**
 * Obtener una empresa por ID
 */
export async function getEnterpriseAction(enterpriseId: string | number): Promise<EnterpriseResponse> {
  try {
    const { response } = await authenticatedFetch(`/enterprises/${enterpriseId}`);

    if (!response.ok) {
      console.error('Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    const enterpriseData = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseData);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    return handleError(error);
  }
}

/**
 * Crear una nueva empresa
 */
export async function createEnterpriseAction(enterpriseData: CreateEnterpriseFormData): Promise<EnterpriseResponse> {
  try {
    // Validar datos con Zod
    const validationResult = createEnterpriseSchema.safeParse(enterpriseData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const payload = EnterpriseAdapter.formToApi(validationResult.data);

    const { response } = await authenticatedFetch('/enterprises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error en respuesta del API:', response.status, response.statusText);
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Error del servidor: ${response.status}`,
      };
    }

    const data = await response.json();

    const enterpriseResult = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseResult);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    return handleError(error);
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
    // Validar datos con Zod
    const validationResult = updateEnterpriseSchema.safeParse(enterpriseData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { response } = await authenticatedFetch(`/enterprises/${enterpriseId}`, {
      method: 'PATCH',
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      console.error('Error en respuesta del API:', response.status, response.statusText);
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Error del servidor: ${response.status}`,
      };
    }

    const data = await response.json();

    const enterpriseResult = data.data || data.enterprise || data;
    const enterprise = EnterpriseAdapter.apiToApp(enterpriseResult);

    return {
      success: true,
      enterprise,
    };

  } catch (error) {
    return handleError(error);
  }
}

/**
 * Eliminar una empresa
 */
export async function deleteEnterpriseAction(enterpriseId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { response } = await authenticatedFetch(`/enterprises/${enterpriseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Error en respuesta del API:', response.status, response.statusText);
      return {
        success: false,
        error: `Error del servidor: ${response.status} ${response.statusText}`,
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    return handleError(error);
  }
}
