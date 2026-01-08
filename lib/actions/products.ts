'use server';

import { cookies } from 'next/headers';
import {
  ProductsResponse,
  ProductResponse,
  ProductsFilters,
} from '../interfaces/product.interface';
import { ProductAdapter } from '../adapters/product.adapter';
import { createProductSchema, CreateProductFormData, updateProductSchema, UpdateProductFormData } from '../schemas/product.schema';

// Helper function to build search payload - simplified for name search only
function buildProductsSearchPayload(filters: ProductsFilters) {
  const payload: Record<string, unknown> = {
    page: filters.page || 1,
    limit: filters.limit || 100,
  };

  // Add search object if present (searches in name field)
  if (filters.searchObj?.value) {
    payload.search = {
      value: filters.searchObj.value,
      case_sensitive: filters.searchObj.case_sensitive !== undefined ? filters.searchObj.case_sensitive : false
    };
  }

  // Handle legacy search parameter
  if (filters.search && !filters.searchObj?.value) {
    payload.search = {
      value: filters.search,
      case_sensitive: false
    };
  }

  console.log('🔍 Products search payload (simple):', JSON.stringify(payload, null, 2));
  
  return payload;
}

// Server Action para obtener lista de productos
export async function getProductsAction(filters?: ProductsFilters): Promise<ProductsResponse> {
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

    // Use POST search if there's any search term
    const useSearch = filters && (
      filters.searchObj?.value ||
      filters.search
    );

    let response: Response;

    if (useSearch && filters) {
      // Use POST /products/search for name search
      const searchPayload = buildProductsSearchPayload(filters);

      response = await fetch(`${apiUrl}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchPayload),
      });
    } else {
      // Use simple GET /products for basic requests
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${apiUrl}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🌐 GET /products - URL completa:', url);
      console.log('🌐 GET /products - Query params:', Object.fromEntries(queryParams));
      console.log('🌐 GET /products - Token (primeros 20 chars):', token?.substring(0, 20));

      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🌐 GET /products - Status:', response.status);
    }

    if (!response.ok) {
      console.log('Error al obtener productos:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de productos:', data);

    // Mapear datos según la estructura de la API
    const products = ProductAdapter.apiProductsToApp(data);

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
      products,
      pagination,
    };

  } catch (error) {
    console.error('Error en getProductsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para obtener un producto específico
export async function getProductAction(productId: string | number): Promise<ProductResponse> {
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

    console.log('Obteniendo producto individual:', productId);
    console.log('URL completa:', `${apiUrl}/products/${productId}`);

    const response = await fetch(`${apiUrl}/products/${productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log('Error al obtener producto:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('Datos de error:', errorData);
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de producto individual:', data);
    
    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productData = data.data || data;
    const product = ProductAdapter.apiToApp(productData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    console.error('Error en getProductAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para crear un nuevo producto
export async function createProductAction(productData: CreateProductFormData): Promise<ProductResponse> {
  try {
    // Validar datos con Zod
    const validationResult = createProductSchema.safeParse(productData);
    
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

    console.log('Creando producto:', validatedData);

    const response = await fetch(`${apiUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      console.log('Error al crear producto:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de creación de producto:', data);
    
    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productResponseData = data.data || data;
    const product = ProductAdapter.apiToApp(productResponseData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    console.error('Error en createProductAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para eliminar un producto
export async function deleteProductAction(productId: string | number): Promise<{ success: boolean; error?: string }> {
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

    console.log('Eliminando producto:', productId);

    const response = await fetch(`${apiUrl}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log('Error al eliminar producto:', response.status, response.statusText);
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    console.log('Producto eliminado exitosamente');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error en deleteProductAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}

// Server Action para actualizar un producto
export async function updateProductAction(productId: string | number, productData: UpdateProductFormData): Promise<ProductResponse> {
  try {
    // Validar datos con Zod
    const validationResult = updateProductSchema.safeParse(productData);
    
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

    console.log('Actualizando producto con ID:', productId);
    console.log('Datos a actualizar:', validatedData);
    console.log('URL de actualización:', `${apiUrl}/products/${productId}`);

    const response = await fetch(`${apiUrl}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      console.log('Error al actualizar producto:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const errorData = await response.json().catch(() => ({}));
      console.log('Datos de error en actualización:', errorData);
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Respuesta de actualización de producto:', data);
    
    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productResponseData = data.data || data;
    const product = ProductAdapter.apiToApp(productResponseData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    console.error('Error en updateProductAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}
