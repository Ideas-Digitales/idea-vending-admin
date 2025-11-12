// Interface para Empresa
export interface Enterprise {
  id: number;
  name: string;
  rut: string;
  address: string;
  phone: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para datos de la API (estructura real del API)
export interface EnterpriseApiData {
  id: number;
  name: string;
  rut: string;
  address: string;
  phone: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para crear una nueva empresa
export interface CreateEnterpriseData {
  name: string;
  rut: string;
  address: string;
  phone: string;
  user_id: number;
}

// Interface para actualizar una empresa
export interface UpdateEnterpriseData {
  name?: string;
  address?: string;
  phone?: string;
}

// Interface para filtros de búsqueda
export interface EnterprisesFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// Interface para paginación
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

// Interface para respuesta de lista de empresas
export interface EnterprisesResponse {
  success: boolean;
  enterprises?: Enterprise[];
  pagination?: {
    meta: PaginationMeta;
    links: PaginationLinks;
  };
  error?: string;
}

// Interface para respuesta de una empresa individual
export interface EnterpriseResponse {
  success: boolean;
  enterprise?: Enterprise;
  error?: string;
}
