import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Enterprise,
  EnterprisesFilters,
  PaginationLinks,
  PaginationMeta,
} from "../interfaces/enterprise.interface";
import {
  getEnterprisesAction,
  getEnterpriseAction,
  createEnterpriseAction,
  updateEnterpriseAction,
  deleteEnterpriseAction,
} from "../actions/enterprise";
import {
  CreateEnterpriseFormData,
  UpdateEnterpriseFormData,
} from "../schemas/enterprise.schema";

interface EnterpriseState {
  // Data state
  enterprises: Enterprise[];
  selectedEnterprise: Enterprise | null;
  currentFilters: EnterprisesFilters;

  // Pagination state
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  } | null;

  // Global stats cache
  globalStats: {
    totalActive: number;
    totalByRegion: Record<string, number>;
    lastUpdated: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingEnterprise: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;

  // Error states
  error: string | null;
  enterpriseError: string | null;
  deleteError: string | null;
  updateError: string | null;

  // Actions
  fetchEnterprises: (filters?: EnterprisesFilters) => Promise<void>;
  fetchEnterprise: (enterpriseId: string | number) => Promise<void>;
  refreshEnterprises: () => Promise<void>;
  createEnterprise: (
    enterpriseData: CreateEnterpriseFormData
  ) => Promise<boolean>;
  deleteEnterprise: (enterpriseId: string | number) => Promise<boolean>;
  updateEnterprise: (
    enterpriseId: string | number,
    enterpriseData: UpdateEnterpriseFormData
  ) => Promise<boolean>;
  setFilters: (filters: EnterprisesFilters) => void;
  initializeEnterprises: (enterprises: Enterprise[], pagination?: any) => void;
  clearError: () => void;
  clearEnterpriseError: () => void;
  clearDeleteError: () => void;
  clearUpdateError: () => void;
  clearSelectedEnterprise: () => void;

  // Computed getters
  getTotalEnterprises: () => number;
  getFilteredEnterprisesCount: () => number;
  getTotalActiveEnterprises: () => Promise<number>;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export const useEnterpriseStore = create<EnterpriseState>()(
  persist(
    (set, get) => ({
      // Initial state
      enterprises: [],
      selectedEnterprise: null,
      currentFilters: {},
      pagination: null,
      globalStats: null,
      isLoading: false,
      isLoadingEnterprise: false,
      isRefreshing: false,
      isDeleting: false,
      isUpdating: false,
      error: null,
      enterpriseError: null,
      deleteError: null,
      updateError: null,

      // Actions
      fetchEnterprises: async (filters?: EnterprisesFilters) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEnterprisesAction(filters);

          if (response.success && response.enterprises) {
            set({
              enterprises: response.enterprises,
              pagination: response.pagination || null,
              currentFilters: filters || {},
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error || "Error al cargar empresas",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Error inesperado",
            isLoading: false,
          });
        }
      },

      fetchEnterprise: async (enterpriseId: string | number) => {
        set({ isLoadingEnterprise: true, enterpriseError: null });

        try {
          const response = await getEnterpriseAction(enterpriseId);

          if (response.success && response.enterprise) {
            set({
              selectedEnterprise: response.enterprise,
              isLoadingEnterprise: false,
              enterpriseError: null,
            });
          } else {
            set({
              enterpriseError: response.error || "Error al cargar empresa",
              isLoadingEnterprise: false,
            });
          }
        } catch (error) {
          set({
            enterpriseError:
              error instanceof Error ? error.message : "Error inesperado",
            isLoadingEnterprise: false,
          });
        }
      },

      refreshEnterprises: async () => {
        const { currentFilters } = get();
        set({ isRefreshing: true });

        try {
          const response = await getEnterprisesAction(currentFilters);

          if (response.success && response.enterprises) {
            set({
              enterprises: response.enterprises,
              pagination: response.pagination || null,
              isRefreshing: false,
              error: null,
            });
          } else {
            set({
              error: response.error || "Error al actualizar empresas",
              isRefreshing: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Error inesperado",
            isRefreshing: false,
          });
        }
      },

      setFilters: (filters: EnterprisesFilters) => {
        set({ currentFilters: filters });
      },

      initializeEnterprises: (enterprises: Enterprise[], pagination?: any) => {
        set({
          enterprises,
          pagination: pagination || null,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      clearEnterpriseError: () => {
        set({ enterpriseError: null });
      },

      clearSelectedEnterprise: () => {
        set({ selectedEnterprise: null, enterpriseError: null });
      },

      createEnterprise: async (enterpriseData: CreateEnterpriseFormData) => {
        set({ isUpdating: true, updateError: null });

        try {
          const response = await createEnterpriseAction(enterpriseData);

          if (response.success && response.enterprise) {
            const { enterprises, pagination } = get();
            const updatedEnterprises = [response.enterprise, ...enterprises];

            const updatedPagination = pagination
              ? {
                  ...pagination,
                  meta: {
                    ...pagination.meta,
                    total: pagination.meta.total + 1,
                  },
                }
              : null;

            set({
              enterprises: updatedEnterprises,
              pagination: updatedPagination,
              isUpdating: false,
              updateError: null,
            });

            return true;
          } else {
            set({
              updateError: response.error || "Error al crear empresa",
              isUpdating: false,
            });
            return false;
          }
        } catch (error) {
          set({
            updateError:
              error instanceof Error ? error.message : "Error inesperado",
            isUpdating: false,
          });
          return false;
        }
      },

      deleteEnterprise: async (enterpriseId: string | number) => {
        const { enterprises } = get();

        const enterpriseToDelete = enterprises.find(
          (e) => e.id === enterpriseId
        );
        if (!enterpriseToDelete) {
          set({ deleteError: "Empresa no encontrada" });
          return false;
        }

        const optimisticEnterprises = enterprises.filter(
          (e) => e.id !== enterpriseId
        );

        set({
          enterprises: optimisticEnterprises,
          isDeleting: true,
          deleteError: null,
        });

        try {
          const response = await deleteEnterpriseAction(enterpriseId);

          if (response.success) {
            const { pagination } = get();
            const updatedPagination = pagination
              ? {
                  ...pagination,
                  meta: {
                    ...pagination.meta,
                    total: pagination.meta.total - 1,
                  },
                }
              : null;

            set({
              isDeleting: false,
              deleteError: null,
              pagination: updatedPagination,
            });
            return true;
          } else {
            set({
              enterprises: enterprises,
              isDeleting: false,
              deleteError: response.error || "Error al eliminar empresa",
            });
            return false;
          }
        } catch (error) {
          set({
            enterprises: enterprises,
            isDeleting: false,
            deleteError:
              error instanceof Error ? error.message : "Error inesperado",
          });
          return false;
        }
      },

      clearDeleteError: () => {
        set({ deleteError: null });
      },

      updateEnterprise: async (
        enterpriseId: string | number,
        enterpriseData: UpdateEnterpriseFormData
      ) => {
        const { enterprises } = get();

        const enterpriseIndex = enterprises.findIndex(
          (e) => e.id === enterpriseId
        );
        if (enterpriseIndex === -1) {
          set({ updateError: "Empresa no encontrada" });
          return false;
        }

        const originalEnterprise = enterprises[enterpriseIndex];
        const optimisticEnterprises = [...enterprises];
        optimisticEnterprises[enterpriseIndex] = {
          ...originalEnterprise,
          ...enterpriseData,
        };

        set({
          enterprises: optimisticEnterprises,
          isUpdating: true,
          updateError: null,
        });

        try {
          const response = await updateEnterpriseAction(
            enterpriseId,
            enterpriseData
          );

          if (response.success && response.enterprise) {
            const updatedEnterprises = [...get().enterprises];
            updatedEnterprises[enterpriseIndex] = response.enterprise;

            set({
              enterprises: updatedEnterprises,
              isUpdating: false,
              updateError: null,
            });
            return true;
          } else {
            set({
              enterprises: enterprises,
              isUpdating: false,
              updateError: response.error || "Error al actualizar empresa",
            });
            return false;
          }
        } catch (error) {
          set({
            enterprises: enterprises,
            isUpdating: false,
            updateError:
              error instanceof Error ? error.message : "Error inesperado",
          });
          return false;
        }
      },

      clearUpdateError: () => {
        set({ updateError: null });
      },

      // Computed getters
      getTotalEnterprises: () => {
        const { pagination } = get();
        return pagination?.meta?.total || 0;
      },

      getFilteredEnterprisesCount: () => {
        const { enterprises } = get();
        return enterprises.length;
      },

      hasNextPage: () => {
        const { pagination } = get();
        return !!pagination?.links?.next;
      },

      hasPrevPage: () => {
        const { pagination } = get();
        return !!pagination?.links?.prev;
      },

      // Global stats functions
      getTotalActiveEnterprises: async () => {
        const { globalStats } = get();

        // Si tenemos stats en cache y son recientes (menos de 5 minutos), usarlas
        if (
          globalStats &&
          Date.now() - globalStats.lastUpdated < 5 * 60 * 1000
        ) {
          return globalStats.totalActive;
        }

        // Si no, calcular desde todas las empresas del servidor
        try {
          const response = await getEnterprisesAction({});
          if (response.success && response.pagination?.meta) {
            const totalActive = response.pagination.meta.total;

            // Actualizar cache
            set((state) => ({
              globalStats: {
                ...state.globalStats,
                totalActive,
                lastUpdated: Date.now(),
              } as typeof state.globalStats,
            }));

            return totalActive;
          }
        } catch (error) {
          console.error("Error getting total active enterprises:", error);
        }

        return 0;
      },
    }),
    {
      name: "enterprise-store",
      partialize: (state) => ({
        enterprises: state.enterprises,
        pagination: state.pagination,
        currentFilters: state.currentFilters,
        globalStats: state.globalStats,
      }),
    }
  )
);
