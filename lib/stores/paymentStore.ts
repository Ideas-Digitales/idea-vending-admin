import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Payment, PaymentFilters, PaginationLinks, PaginationMeta } from "../interfaces/payment.interface";
import { getPaymentsAction } from "../actions/payments";
import { useAuthStore } from "./authStore";
import { isSessionExpiredError, handleSessionExpired } from "../utils/sessionErrorHandler";

interface PaymentState {
  // Data state
  payments: Payment[];
  currentFilters: PaymentFilters;
  
  // Pagination state
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error states
  error: string | null;
  lastRealtimePayment: Payment | null;
  lastRealtimeReceivedAt: string | null;
  
  // Actions
  fetchPayments: (filters?: PaymentFilters) => Promise<void>;
  refreshPayments: () => Promise<void>;
  setFilters: (filters: PaymentFilters) => void;
  clearError: () => void;
  addRealtimePayment: (payment: Payment) => void;
  reset: () => void;
  
  // Computed getters
  getTotalPayments: () => number;
  getFilteredPaymentsCount: () => number;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      // Initial state
      payments: [],
      currentFilters: {},
      pagination: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastRealtimePayment: null,
      lastRealtimeReceivedAt: null,

      // Actions
      fetchPayments: async (filters?: PaymentFilters) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPaymentsAction(filters);
          
          if (response.success && response.payments) {
            set({
              payments: response.payments,
              pagination: response.pagination || null,
              currentFilters: filters || {},
              isLoading: false,
              error: null,
            });
          } else if (isSessionExpiredError(response.error)) {
            set({ isLoading: false });
            handleSessionExpired();
          } else {
            set({
              error: response.error || 'Error al cargar pagos',
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error inesperado',
            isLoading: false,
          });
        }
      },

      refreshPayments: async () => {
        const { currentFilters } = get();
        set({ isRefreshing: true });

        try {
          const response = await getPaymentsAction(currentFilters);
          
          if (response.success && response.payments) {
            set({
              payments: response.payments,
              pagination: response.pagination || null,
              isRefreshing: false,
              error: null,
            });
          } else if (isSessionExpiredError(response.error)) {
            set({ isRefreshing: false });
            handleSessionExpired();
          } else {
            set({
              error: response.error || 'Error al actualizar pagos',
              isRefreshing: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error inesperado',
            isRefreshing: false,
          });
        }
      },

      setFilters: (filters: PaymentFilters) => {
        set({ currentFilters: filters });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          payments: [],
          currentFilters: {},
          pagination: null,
          error: null,
          lastRealtimePayment: null,
          lastRealtimeReceivedAt: null,
        });
      },

      addRealtimePayment: (payment: Payment) => {
        set((state) => {
          if (!matchesFilters(payment, state.currentFilters)) {
            return state;
          }

          const mergedPayments = upsertPayment(state.payments, payment);
          const limit = state.currentFilters?.limit;
          const constrainedPayments = typeof limit === 'number' ? mergedPayments.slice(0, limit) : mergedPayments;

          return {
            payments: constrainedPayments,
            lastRealtimePayment: payment,
            lastRealtimeReceivedAt: new Date().toISOString(),
          };
        });
      },

      // Computed getters
      getTotalPayments: () => {
        const { pagination } = get();
        return pagination?.meta?.total || 0;
      },

      getFilteredPaymentsCount: () => {
        const { payments } = get();
        return payments.length;
      },

      hasNextPage: () => {
        const { pagination } = get();
        return !!pagination?.links?.next;
      },

      hasPrevPage: () => {
        const { pagination } = get();
        return !!pagination?.links?.prev;
      },
    }),
    {
      name: 'payment-store',
      partialize: (state) => ({
        payments: state.payments,
        pagination: state.pagination,
        currentFilters: state.currentFilters,
        lastRealtimeReceivedAt: state.lastRealtimeReceivedAt,
      }),
    }
  )
);

function matchesFilters(payment: Payment, filters: PaymentFilters | undefined): boolean {
  if (!filters) {
    return true;
  }

  if (filters.successful !== undefined && filters.successful !== null && payment.successful !== filters.successful) {
    return false;
  }

  if (filters.machine_id && payment.machine_id !== filters.machine_id) {
    return false;
  }

  if (filters.enterprise_id && payment.enterprise_id !== filters.enterprise_id) {
    return false;
  }

  if (filters.card_type && payment.card_type?.toLowerCase() !== filters.card_type.toLowerCase()) {
    return false;
  }

  if (filters.card_brand) {
    const brandMatch = payment.card_brand?.toLowerCase().includes(filters.card_brand.toLowerCase());
    if (!brandMatch) {
      return false;
    }
  }

  if (filters.date_from) {
    const paymentDate = new Date(payment.date);
    if (paymentDate < new Date(filters.date_from)) {
      return false;
    }
  }

  if (filters.date_to) {
    const paymentDate = new Date(payment.date);
    if (paymentDate > new Date(filters.date_to)) {
      return false;
    }
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    const searchableFields = [
      payment.product,
      payment.operation_number,
      payment.card_brand,
      payment.last_digits,
      payment.machine_name ?? undefined,
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());

    const match = searchableFields.some((field) => field.includes(query));
    if (!match) {
      return false;
    }
  }

  return true;
}

function upsertPayment(payments: Payment[], incoming: Payment): Payment[] {
  const list = [...payments];
  const index = list.findIndex((payment) => {
    if (incoming.id && payment.id === incoming.id) {
      return true;
    }
    if (incoming.operation_number && payment.operation_number === incoming.operation_number) {
      return true;
    }
    return false;
  });

  if (index >= 0) {
    list[index] = incoming;
  } else {
    list.unshift(incoming);
  }

  return list;
}
