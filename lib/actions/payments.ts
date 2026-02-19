'use server';

import { PaymentResponse, PaymentFilters } from '../interfaces/payment.interface';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import { AuthFetchError } from '../utils/authFetchError';

const TOKEN_EXPIRED_ERROR = 'SESSION_EXPIRED';

function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    return { success: false, error: error.code === 'TOKEN_EXPIRED' ? TOKEN_EXPIRED_ERROR : error.message };
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
