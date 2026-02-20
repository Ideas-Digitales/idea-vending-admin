// MQTT User interface
export interface MqttUser {
  id: number;
  username: string;
  is_superuser: boolean;
  user_id: number | null;
  original_password: string;
  client_id: string;
  connection_status: boolean;
}

export type MachineStatus = 'online' | 'offline';

export interface MachineEnterprise {
  id: number;
  name: string;
}

// Machine interfaces
export interface Machine {
  id: number;
  name: string;
  status: MachineStatus;
  location: string;
  created_at: string;
  updated_at: string;
  type: string;
  enterprise_id: number;
  enterprise?: MachineEnterprise;
  client_id?: number | null;
  mqtt_user?: MqttUser;
  connection_status: boolean;
}

// API Response interfaces
export interface ApiMachine {
  id: number | string;
  name?: string;
  machine_name?: string;
  status?: string;
  location?: string;
  address?: string;
  client_id?: number | null;
  clientId?: number | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  type?: string;
  machine_type?: string;
  enterprise_id?: number;
  enterpriseId?: number;
  enterprise?: { id: number; name: string };
  connection_status?: boolean;
  connected?: boolean;
  mqtt_user?: MqttUser | null;
  // Campos adicionales que pueden venir de la API
  [key: string]: unknown;
}

export interface ApiMachinesResponse {
  data?: ApiMachine[];
  machines?: ApiMachine[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
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

// Request/Response interfaces
export interface MachinesResponse {
  success: boolean;
  machines?: Machine[];
  error?: string;
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
}

export interface MachineResponse {
  success: boolean;
  machine?: Machine;
  error?: string;
}

export interface MachinesFilters {
  search?: string;
  status?: MachineStatus;
  type?: string;
  enterprise_id?: number;
  page?: number;
  limit?: number;
}

// Form data interfaces
export interface CreateMachine {
  name: string;
  location: string;
  type: string;
  enterprise_id: number;
  client_id?: number | null;
}

export interface UpdateMachine {
  name?: string;
  location?: string;
  type?: string;
  status?: MachineStatus;
  client_id?: number | null;
}