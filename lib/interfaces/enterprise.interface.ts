// Enterprise interface for application data - matches API response
export interface Enterprise {
  id: number | string;
  name: string;
  rut: string;
  address: string;
  phone: string;
  // Relaciones opcionales (solo cuando se incluyen con ?include=)
  owner?: EnterpriseOwner;
  users?: EnterpriseUser[];
  machines?: EnterpriseMachine[];
}

// Interfaz para el propietario de la empresa
export interface EnterpriseOwner {
  id: number;
  name: string;
  email: string;
  rut: string;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Interfaz para usuarios de la empresa
export interface EnterpriseUser {
  id: number;
  name: string;
  email: string;
  rut: string;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Interfaz para máquinas de la empresa
export interface EnterpriseMachine {
  id: number;
  name: string;
  status: 'Active' | 'Inactive' | 'OutOfService';
  is_enabled: boolean;
  location: string;
  type: 'MDB' | 'MDB-DEX' | 'PULSES';
  created_at: string;
  updated_at: string;
}

// Interface for data coming from the API/backend
export interface EnterpriseApiData {
  id?: number | string;
  enterprise_id?: number | string;
  name?: string;
  enterprise_name?: string;
  rut?: string;
  address?: string;
  phone?: string;
  user_id?: number;
  userId?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  // Relaciones opcionales (cuando se incluyen con ?include=)
  owner?: EnterpriseOwner;
  users?: EnterpriseUser[];
  machines?: EnterpriseMachine[];
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
export interface ApiEnterprisesResponse {
  data?: EnterpriseApiData[];
  enterprises?: EnterpriseApiData[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}

export interface EnterprisesResponse {
  success: boolean;
  enterprises?: Enterprise[];
  error?: string;
  pagination?: Pagination;
}

// Single enterprise response interface
export interface EnterpriseResponse {
  success: boolean;
  enterprise?: Enterprise;
  error?: string;
}

// Interfaces para filtros avanzados (para uso futuro)
export interface ApiFilter {
  type: 'and' | 'or';
  field: string;
  operator: '<' | '<=' | '>' | '>=' | '=' | '!=' | 'like' | 'not like' | 'ilike' | 'not ilike' | 'in' | 'not in' | 'all in' | 'any in';
  value: string | number | boolean;
  nested?: ApiFilter[];
}

export interface ApiSearch {
  value: string;
  case_sensitive?: boolean;
}

export interface ApiInclude {
  relation: 'owner' | 'users' | 'machines';
  filters?: {
    type: null;
    items: ApiFilter;
  };
}

export interface ApiFiltersPayload {
  filters?: ApiFilter[];
  search?: ApiSearch;
  includes?: ApiInclude[];
}

// Filters interface simplificada para el frontend
export interface EnterprisesFilters {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
  include?: ('owner' | 'users' | 'machines')[];
}