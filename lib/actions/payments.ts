import { PaymentResponse, PaymentFilters } from '../interfaces/payment.interface';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get token from authStore persistent storage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get token from authStore persistent storage
    const authStoreData = localStorage.getItem('auth-store');
    if (authStoreData) {
      const parsedData = JSON.parse(authStoreData);
      if (parsedData?.state?.token) {
        console.log('Token encontrado en authStore');
        return parsedData.state.token;
      }
    }
    
    // Fallback to direct localStorage
    const tokenFromStorage = localStorage.getItem('auth-token');
    if (tokenFromStorage) {
      console.log('Token encontrado en localStorage directo');
      return tokenFromStorage;
    }
    
    // Last fallback to cookies
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    
    if (authCookie) {
      const token = authCookie.split('=')[1];
      console.log('Token encontrado en cookies');
      return token;
    }
    
    console.log('No se encontró token en ninguna ubicación');
    return null;
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

export const getPaymentsAction = async (filters?: PaymentFilters, token?: string): Promise<PaymentResponse> => {
  console.log('getPaymentsAction llamado con filtros:', filters);
  
  if (!apiUrl) {
    console.error('API URL no configurada');
    return { success: false, error: 'API URL no configurada' };
  }

  try {
    // Get auth token from parameter or fallback to client-side storage
    const authToken = token || getAuthToken();

    if (!authToken) {
      console.error('Token de autenticación no encontrado');
      return { success: false, error: 'Token de autenticación no encontrado' };
    }

    // Build query parameters for pagination
    const queryParams = new URLSearchParams();
    
    if (filters?.page) {
      queryParams.append('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      queryParams.append('per_page', filters.limit.toString());
    }

    type FilterCondition = {
      type: 'and' | 'or';
      field: string;
      operator: '<' | '<=' | '>' | '>=' | '=' | '!=' | 'like' | 'not like' | 'ilike' | 'not ilike' | 'in' | 'not in' | 'all in' | 'any in';
      value: string;
    };

    interface PaymentSearchRequest {
      filters?: FilterCondition[];
      search?: {
        value: string;
        case_sensitive?: boolean;
      };
      includes?: Array<{
        relation: 'machine';
      }>;
    }

    const buildFilterConditions = (): FilterCondition[] => {
      const conditions: FilterCondition[] = [];

      if (!filters) {
        return conditions;
      }

      const pushCondition = (condition: FilterCondition) => {
        conditions.push(condition);
      };

      if (filters.successful !== undefined && filters.successful !== null) {
        pushCondition({
          type: 'and',
          field: 'successful',
          operator: '=',
          value: filters.successful ? 'true' : 'false',
        });
      }

      if (filters.machine_id) {
        pushCondition({
          type: 'and',
          field: 'machine_id',
          operator: '=',
          value: filters.machine_id.toString(),
        });
      }

      if (filters.card_type) {
        pushCondition({
          type: 'and',
          field: 'card_type',
          operator: '=',
          value: filters.card_type,
        });
      }

      if (filters.card_brand) {
        pushCondition({
          type: 'and',
          field: 'card_brand',
          operator: 'ilike',
          value: `%${filters.card_brand}%`,
        });
      }

      if (filters.date_from) {
        pushCondition({
          type: 'and',
          field: 'date',
          operator: '>=',
          value: filters.date_from,
        });
      }

      if (filters.date_to) {
        pushCondition({
          type: 'and',
          field: 'date',
          operator: '<=',
          value: filters.date_to,
        });
      }

      return conditions;
    };

    const searchPayload: PaymentSearchRequest = {};
    const filterConditions = buildFilterConditions();

    if (filterConditions.length > 0) {
      searchPayload.filters = filterConditions;
    }

    if (filters?.search) {
      searchPayload.search = {
        value: filters.search,
        case_sensitive: false,
      };
    }

    if (filters?.include) {
      searchPayload.includes = [
        {
          relation: filters.include,
        },
      ];
    }

    const url = `${apiUrl}/payments/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('URL de pagos:', url);
    console.log('Payload de búsqueda:', searchPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(searchPayload),
    });

    console.log('Status de respuesta:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al obtener pagos:', errorData);
      return { 
        success: false, 
        error: errorData.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log('Datos de pagos recibidos:', data);

    // Extract payments and pagination from response
    const payments = data.data || [];
    const pagination = {
      links: data.links || {},
      meta: data.meta || {}
    };

    return {
      success: true,
      payments,
      pagination
    };

  } catch (error) {
    console.error('Error en getPaymentsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado'
    };
  }
};
