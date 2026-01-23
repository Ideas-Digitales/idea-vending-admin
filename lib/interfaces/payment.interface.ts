export interface Payment {
  id: number;
  successful: boolean;
  amount: number;
  date: string;
  product: string;
  response_code: number;
  response_message: string;
  commerce_code: string;
  terminal_id: string;
  authorization_code: number;
  last_digits: string;
  operation_number: string;
  card_type: string | null;
  card_brand: string;
  share_type: string | null;
  shares_number: number | null;
  shares_amount: number | null;
  machine_id: number | null;
  created_at: string;
  updated_at: string;
  enterprise_id: number | null;
  machine_name: string | null;
  machine?: {
    id: number;
    name: string;
    status: string;
    location: string;
    created_at: string;
    updated_at: string;
    type: string;
    enterprise_id: number | null;
    client_id?: number | null;
    connection_status?: boolean;
  } | null;
}

export interface PaymentFilters {
  search?: string;
  successful?: boolean | null;
  machine_id?: number | null;
  enterprise_id?: number | null;
  card_type?: string;
  card_brand?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  include?: 'machine';
}

export interface PaymentResponse {
  success: boolean;
  payments?: Payment[];
  pagination?: {
    links: PaginationLinks;
    meta: PaginationMeta;
  };
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
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}
