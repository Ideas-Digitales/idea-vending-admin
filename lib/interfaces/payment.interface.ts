export type SaleStatus = 'completed' | 'failed' | 'canceled' | 'unknown';

export interface Payment {
  id: number;
  uuid?: string | null;
  successful: boolean;
  amount: number;
  date: string;
  product: string | null;
  product_id?: number | null;
  response_code: string | null;
  response_message: string | null;
  commerce_code: string | null;
  terminal_id: string | null;
  authorization_code: string | null;
  last_digits: string | null;
  operation_number: string | null;
  card_type: string | null;
  card_brand: string | null;
  share_type: string | null;
  shares_number: number | null;
  shares_amount: number | null;
  machine_id: number | null;
  enterprise_id: number | null;
  sale_status: SaleStatus | null;
  meta: { mdb_code?: number | null; [key: string]: unknown } | null;
  created_at: string;
  updated_at: string;
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

export interface SortParam {
  field: string;
  direction: 'asc' | 'desc';
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
  sort?: SortParam[];
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
