'use server';

import {
  ProductsResponse,
  ProductResponse,
  ProductsFilters,
} from '../interfaces/product.interface';
import { ProductAdapter } from '../adapters/product.adapter';
import { createProductSchema, CreateProductFormData, updateProductSchema, UpdateProductFormData } from '../schemas/product.schema';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';

const DEFAULT_PAGE_SIZE = 20;
const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    return { success: false, error: error.code === 'TOKEN_EXPIRED' ? TOKEN_EXPIRED_ERROR : error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

// Helper function to build search payload - simplified for name search only
function buildProductsSearchPayload(filters: ProductsFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.limit || DEFAULT_PAGE_SIZE;

  const payload: Record<string, unknown> = {
    page,
    per_page: pageSize,
    limit: pageSize,
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

  return payload;
}

// Server Action para obtener lista de productos
export async function getProductsAction(filters?: ProductsFilters): Promise<ProductsResponse> {
  try {
    // Use POST search if there's any search term
    const useSearch = filters && (
      filters.searchObj?.value ||
      filters.search
    );

    let response: Response;

    if (useSearch && filters) {
      // Use POST /products/search for name search
      const searchPayload = buildProductsSearchPayload(filters);

      ({ response } = await authenticatedFetch('/products/search', {
        method: 'POST',
        body: JSON.stringify(searchPayload),
      }));
    } else {
      // Use simple GET /products for basic requests
      const page = filters?.page || 1;
      const limit = filters?.limit || DEFAULT_PAGE_SIZE;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', limit.toString());
      queryParams.append('limit', limit.toString());

      const path = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      ({ response } = await authenticatedFetch(path, {
        method: 'GET',
      }));
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

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
    return handleError(error);
  }
}

// Server Action para obtener un producto específico
export async function getProductAction(productId: string | number): Promise<ProductResponse> {
  try {
    const { response } = await authenticatedFetch(`/products/${productId}`, {
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

    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productData = data.data || data;
    const product = ProductAdapter.apiToApp(productData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    return handleError(error);
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

    const { response } = await authenticatedFetch('/products', {
      method: 'POST',
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

    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productResponseData = data.data || data;
    const product = ProductAdapter.apiToApp(productResponseData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    return handleError(error);
  }
}

// Server Action para eliminar un producto
export async function deleteProductAction(productId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { response } = await authenticatedFetch(`/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    return handleError(error);
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

    const { response } = await authenticatedFetch(`/products/${productId}`, {
      method: 'PATCH',
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

    // La API puede devolver el producto directamente o dentro de un objeto "data"
    const productResponseData = data.data || data;
    const product = ProductAdapter.apiToApp(productResponseData);

    return {
      success: true,
      product,
    };

  } catch (error) {
    return handleError(error);
  }
}
