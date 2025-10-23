'use server';

import { cookies } from 'next/headers';

// Interfaces
export interface Producto {
  id: number | string;
  name: string;
  created_at: string;
  updated_at: string;
  enterprise_id: number;
  // Campos adicionales que podrían necesitarse (MOCK por ahora)
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
  barcode?: string;
  is_active?: boolean;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
}

export interface ProductsResponse {
  success: boolean;
  products?: Producto[];
  error?: string;
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export interface ProductsFilters {
  search?: string;
  category?: string;
  is_active?: boolean;
  enterprise_id?: number;
  page?: number;
  limit?: number;
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

    // Construir query parameters
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    if (filters?.enterprise_id) queryParams.append('enterprise_id', filters.enterprise_id.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const url = `${apiUrl}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Obteniendo productos desde:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

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
    const products = mapProductsData(data);

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
export async function getProductAction(productId: string | number): Promise<{ success: boolean; product?: Producto; error?: string }> {
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

    const response = await fetch(`${apiUrl}/products/${productId}`, {
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
    const product = mapProductData(data);

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

// Funciones auxiliares para mapear datos
function mapProductsData(apiData: any): Producto[] {
  // La API puede devolver los productos en diferentes estructuras
  const productsArray = apiData.data || apiData.products || apiData || [];
  
  if (!Array.isArray(productsArray)) {
    console.warn('Los datos de productos no están en formato de array:', apiData);
    return [];
  }

  return productsArray.map(mapProductData);
}

function mapProductData(productData: any): Producto {
  return {
    id: productData.id || productData.product_id || productData.productId || 0,
    name: productData.name || productData.product_name || 'Producto Sin Nombre',
    created_at: productData.created_at || productData.createdAt || new Date().toISOString(),
    updated_at: productData.updated_at || productData.updatedAt || new Date().toISOString(),
    enterprise_id: productData.enterprise_id || productData.enterpriseId || 1,
    // Campos adicionales (MOCK por ahora hasta que estén en la API)
    description: productData.description || 'Descripción no disponible',
    price: productData.price || Math.floor(Math.random() * 5000) + 500, // MOCK: precio aleatorio
    category: productData.category || getRandomCategory(),
    stock: productData.stock || Math.floor(Math.random() * 100),
    image: productData.image || '/placeholder-product.jpg',
    barcode: productData.barcode || generateMockBarcode(),
    is_active: productData.is_active ?? productData.active ?? true,
  };
}

// Funciones auxiliares para datos MOCK
function getRandomCategory(): string {
  const categories = ['Bebidas', 'Snacks', 'Dulces', 'Saludable', 'Lácteos', 'Panadería'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function generateMockBarcode(): string {
  return (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString();
}
