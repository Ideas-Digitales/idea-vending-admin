// User interface for application data
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  rut: string;
  role: 'admin' | 'operator' | 'viewer' | 'No role';
  status: 'active' | 'inactive' | 'No status';
  lastLogin: string;
  permissions: string[];
}

// Interface for data coming from the API/backend
export interface UserApiData {
  id: number;
  name: string;
  email: string;
  rut: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// API response interfaces
export interface ApiUsersResponse {
  users?: UserApiData[];
  data?: UserApiData[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
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
  };
}

export interface Pagination {
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
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
  };
}

export interface AppUsersResponse {
  success: boolean;
  users?: User[];
  error?: string;
  pagination?: Pagination;
}

// Single user response interface
export interface UserResponse {
  success: boolean;
  user?: User;
  error?: string;
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

export interface UsersResponse {
  success: boolean;
  users?: User[];
  error?: string;
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export interface UsersFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Interface para crear usuario (datos que se envían a la API)
export interface CreateUser {
  name: string;
  email: string;
  rut: string;
  password: string;
  password_confirmation: string;
  role: string;
}