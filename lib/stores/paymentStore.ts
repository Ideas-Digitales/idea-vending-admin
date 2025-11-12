import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Payment, PaymentFilters, PaginationLinks, PaginationMeta } from "../interfaces/payment.interface";
import { getPaymentsAction } from "../actions/payments";
import { useAuthStore } from "./authStore";

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
  
  // Actions
  fetchPayments: (filters?: PaymentFilters) => Promise<void>;
  refreshPayments: () => Promise<void>;
  setFilters: (filters: PaymentFilters) => void;
  clearError: () => void;
  
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

      // Actions
      fetchPayments: async (filters?: PaymentFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get token from authStore
          const authState = useAuthStore.getState();
          const token = authState.token;
          
          if (!token) {
            set({
              error: 'No hay sesión activa. Por favor, inicia sesión.',
              isLoading: false,
            });
            return;
          }
          
          const response = await getPaymentsAction(filters, token);
          
          if (response.success && response.payments) {
            set({
              payments: response.payments,
              pagination: response.pagination || null,
              currentFilters: filters || {},
              isLoading: false,
              error: null,
            });
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
          // Get token from authStore
          const authState = useAuthStore.getState();
          const token = authState.token;
          
          if (!token) {
            set({
              error: 'No hay sesión activa. Por favor, inicia sesión.',
              isRefreshing: false,
            });
            return;
          }
          
          const response = await getPaymentsAction(currentFilters, token);
          
          if (response.success && response.payments) {
            set({
              payments: response.payments,
              pagination: response.pagination || null,
              isRefreshing: false,
              error: null,
            });
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
      }),
    }
  )
);
