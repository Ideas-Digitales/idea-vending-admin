// Product interface for application data
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

// Interface for data coming from the API/backend
export interface ProductApiData {
  id?: number | string;
  product_id?: number | string;
  name?: string;
  product_name?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  enterprise_id?: number;
  enterpriseId?: number;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
  barcode?: string;
  is_active?: boolean;
  active?: boolean;
}

// Pagination interfaces
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

export interface Pagination {
  links: PaginationLinks;
  meta: PaginationMeta;
}

// API response interfaces
export interface ApiProductsResponse {
  data?: ProductApiData[];
  products?: ProductApiData[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}

export interface ProductsResponse {
  success: boolean;
  products?: Producto[];
  error?: string;
  pagination?: Pagination;
}

// Single product response interface
export interface ProductResponse {
  success: boolean;
  product?: Producto;
  error?: string;
}

// Filters interface - simplified for name search only
export interface ProductsFilters {
  search?: string;
  page?: number;
  limit?: number;
  searchObj?: {
    value?: string;
    case_sensitive?: boolean;
  };
  enterpriseId?: number;
}

// Create product interface
export interface CreateProduct {
  name: string;
  enterprise_id: number;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
  barcode?: string;
  is_active?: boolean;
}

// Product filter interface for search - only name field
export interface ProductFilter {
  field?: 'name';
  operator?: '<' | '<=' | '>' | '>=' | '==' | '!=' | 'like' | 'not like' | 'ilike' | 'not ilike' | 'in' | 'not in' | 'all in' | 'any in';
  value?: string | number | boolean;
  type?: 'and' | 'or';
  nested?: ProductFilter[];
}