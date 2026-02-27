'use server';

import { PaymentResponse, PaymentFilters } from '../interfaces/payment.interface';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';

export interface AggregateFilters {
  start_date?: string;
  end_date?: string;
  machine_id?: number;
  enterprise_id?: number;
  product_id?: number;
  group_by?: 'day' | 'month' | 'year';
}

export interface AggregateDataPoint {
  date: string;
  total_amount: number;
  total_count: number;
}

export interface AggregateResult {
  success: boolean;
  total_amount?: number;
  total_count?: number;
  data?: AggregateDataPoint[];
  filters_applied?: object;
  error?: string;
}

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'NO_TOKEN') {
      return { success: false, error: TOKEN_EXPIRED_ERROR };
    }
    return { success: false, error: error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}

export const getPaymentsAction = async (filters?: PaymentFilters): Promise<PaymentResponse> => {
  try {
    // Build query parameters for pagination
    const queryParams = new URLSearchParams();

    if (filters?.page) {
      queryParams.append('page', filters.page.toString());
    }

    if (filters?.limit) {
      queryParams.append('per_page', filters.limit.toString());
    }

    type FilterCondition = {
      type: 'and' | 'or';
      field: string;
      operator: '<' | '<=' | '>' | '>=' | '=' | '!=' | 'like' | 'not like' | 'ilike' | 'not ilike' | 'in' | 'not in' | 'all in' | 'any in';
      value: string;
    };

    interface PaymentSearchRequest {
      filters?: FilterCondition[];
      search?: {
        value: string;
        case_sensitive?: boolean;
      };
      includes?: Array<{
        relation: 'machine';
      }>;
    }

    const buildFilterConditions = (): FilterCondition[] => {
      const conditions: FilterCondition[] = [];

      if (!filters) {
        return conditions;
      }

      if (filters.successful !== undefined && filters.successful !== null) {
        conditions.push({
          type: 'and',
          field: 'successful',
          operator: '=',
          value: filters.successful ? 'true' : 'false',
        });
      }

      if (filters.machine_id) {
        conditions.push({
          type: 'and',
          field: 'machine_id',
          operator: '=',
          value: filters.machine_id.toString(),
        });
      }

      if (filters.enterprise_id) {
        conditions.push({
          type: 'and',
          field: 'enterprise_id',
          operator: '=',
          value: filters.enterprise_id.toString(),
        });
      }

      if (filters.card_type) {
        conditions.push({
          type: 'and',
          field: 'card_type',
          operator: '=',
          value: filters.card_type,
        });
      }

      if (filters.card_brand) {
        conditions.push({
          type: 'and',
          field: 'card_brand',
          operator: 'ilike',
          value: `%${filters.card_brand}%`,
        });
      }

      if (filters.date_from) {
        conditions.push({
          type: 'and',
          field: 'date',
          operator: '>=',
          value: filters.date_from,
        });
      }

      if (filters.date_to) {
        conditions.push({
          type: 'and',
          field: 'date',
          operator: '<=',
          value: filters.date_to,
        });
      }

      return conditions;
    };

    const searchPayload: PaymentSearchRequest = {};
    const filterConditions = buildFilterConditions();

    if (filterConditions.length > 0) {
      searchPayload.filters = filterConditions;
    }

    if (filters?.search) {
      searchPayload.search = {
        value: filters.search,
        case_sensitive: false,
      };
    }

    if (filters?.include) {
      searchPayload.includes = [
        {
          relation: filters.include,
        },
      ];
    }

    const path = `/payments/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const { response } = await authenticatedFetch(path, {
      method: 'POST',
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    const payments = data.data || [];
    const pagination = {
      links: data.links || {},
      meta: data.meta || {},
    };

    return {
      success: true,
      payments,
      pagination,
    };
  } catch (error) {
    return handleError(error);
  }
};

export interface ProductRankingFilters {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface RankedProduct {
  id: number;
  name: string;
  payments_quantity: number;
  payments_amount: number;
}

export interface ProductRankingResult {
  success: boolean;
  metadata?: { start_date: string; end_date: string; total_products_analyzed: number };
  top_performers?: RankedProduct[];
  low_performers?: RankedProduct[];
  error?: string;
}

export const productRankingAction = async (filters?: ProductRankingFilters): Promise<ProductRankingResult> => {
  try {
    const { response } = await authenticatedFetch('/payments/reports/product-ranking', {
      method: 'POST',
      body: JSON.stringify(filters ?? {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      metadata:       data.metadata,
      top_performers: data.data?.top_performers ?? [],
      low_performers: data.data?.low_performers ?? [],
    };
  } catch (error) {
    return handleError(error);
  }
};

export interface MachineRankingFilters {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface RankedMachine {
  id: number;
  name: string;
  location?: string;
  payments_quantity: number;
  payments_amount: number;
}

export interface MachineRankingResult {
  success: boolean;
  metadata?: { start_date: string; end_date: string; total_machines_analyzed: number };
  top_performers?: RankedMachine[];
  low_performers?: RankedMachine[];
  error?: string;
}

export const machineRankingAction = async (filters: MachineRankingFilters): Promise<MachineRankingResult> => {
  try {
    const { response } = await authenticatedFetch('/machines/reports/machine-ranking', {
      method: 'POST',
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      metadata:       data.metadata,
      top_performers: data.data?.top_performers ?? [],
      low_performers: data.data?.low_performers ?? [],
    };
  } catch (error) {
    return handleError(error);
  }
};

export const aggregatePaymentsAction = async (filters?: AggregateFilters): Promise<AggregateResult> => {
  try {
    const { response } = await authenticatedFetch('/payments/aggregate', {
      method: 'POST',
      body: JSON.stringify(filters ?? {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      total_amount: data.total_amount,
      total_count: data.total_count,
      data: data.data,
      filters_applied: data.filters_applied,
    };
  } catch (error) {
    return handleError(error);
  }
};
