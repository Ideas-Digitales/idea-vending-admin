// User related interfaces
export interface User {
  id: number | string;
  name: string;
  email: string;
  rut: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  updatedAt?: string;
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