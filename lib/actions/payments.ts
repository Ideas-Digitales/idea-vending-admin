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

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (filters?.page) {
      queryParams.append('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      queryParams.append('per_page', filters.limit.toString());
    }
    
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }
    
    if (filters?.successful !== undefined && filters.successful !== null) {
      queryParams.append('successful', filters.successful.toString());
    }
    
    if (filters?.machine_id) {
      queryParams.append('machine_id', filters.machine_id.toString());
    }
    
    if (filters?.card_type) {
      queryParams.append('card_type', filters.card_type);
    }
    
    if (filters?.card_brand) {
      queryParams.append('card_brand', filters.card_brand);
    }
    
    if (filters?.date_from) {
      queryParams.append('date_from', filters.date_from);
    }
    
    if (filters?.date_to) {
      queryParams.append('date_to', filters.date_to);
    }

    const url = `${apiUrl}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('URL de pagos:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
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
