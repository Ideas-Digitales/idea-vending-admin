import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Machine, MachinesFilters, PaginationLinks, PaginationMeta } from "../interfaces/machine.interface";
import { getMachinesAction, getMachineAction, deleteMachineAction, updateMachineAction, createMachineAction } from "../actions/machines";
import { CreateMachineFormData, UpdateMachineFormData } from "../schemas/machine.schema";
import { isSessionExpiredError, handleSessionExpired } from "../utils/sessionErrorHandler";

interface MachineState {
  // Data state
  machines: Machine[];
  selectedMachine: Machine | null;
  currentFilters: MachinesFilters;

  // Pagination state
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  } | null;

  // Global stats cache
  globalStats: {
    totalOnline: number;
    totalOffline: number;
    totalConnected: number;
    lastUpdated: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingMachine: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  isCreating: boolean;

  // Error states
  error: string | null;
  machineError: string | null;
  deleteError: string | null;
  updateError: string | null;
  createError: string | null;

  // Actions
  fetchMachines: (filters?: MachinesFilters) => Promise<void>;
  fetchMachine: (machineId: string | number) => Promise<void>;
  refreshMachines: () => Promise<void>;
  createMachine: (machineData: CreateMachineFormData) => Promise<boolean>;
  deleteMachine: (machineId: string | number) => Promise<boolean>;
  updateMachine: (machineId: string | number, machineData: UpdateMachineFormData) => Promise<boolean>;
  setFilters: (filters: MachinesFilters) => void;
  initializeMachines: (machines: Machine[], pagination?: { links: PaginationLinks; meta: PaginationMeta }) => void;
  clearError: () => void;
  clearMachineError: () => void;
  clearDeleteError: () => void;
  clearUpdateError: () => void;
  clearCreateError: () => void;
  clearSelectedMachine: () => void;
  reset: () => void;

  // Computed getters
  getTotalMachines: () => number;
  getFilteredMachinesCount: () => number;
  getTotalOnlineMachines: () => Promise<number>;
  getTotalOfflineMachines: () => Promise<number>;
  getTotalConnectedMachines: () => Promise<number>;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export const useMachineStore = create<MachineState>()(
  persist(
    (set, get) => ({
      // Initial state
      machines: [],
      selectedMachine: null,
      currentFilters: {},
      pagination: null,
      globalStats: null,
      isLoading: false,
      isLoadingMachine: false,
      isRefreshing: false,
      isDeleting: false,
      isUpdating: false,
      isCreating: false,
      error: null,
      machineError: null,
      deleteError: null,
      updateError: null,
      createError: null,

      // Actions
      fetchMachines: async (filters?: MachinesFilters) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getMachinesAction(filters);

          if (response.success && response.machines) {
            set({
              machines: response.machines,
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
              error: response.error || 'Error al cargar máquinas',
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

      fetchMachine: async (machineId: string | number) => {
        set({ isLoadingMachine: true, machineError: null });

        try {
          const response = await getMachineAction(machineId, { include: 'enterprise' });

          if (response.success && response.machine) {
            set({
              selectedMachine: response.machine,
              isLoadingMachine: false,
              machineError: null,
            });
          } else if (isSessionExpiredError(response.error)) {
            set({ isLoadingMachine: false });
            handleSessionExpired();
          } else {
            set({
              machineError: response.error || 'Error al cargar máquina',
              isLoadingMachine: false,
            });
          }
        } catch (error) {
          set({
            machineError: error instanceof Error ? error.message : 'Error inesperado',
            isLoadingMachine: false,
          });
        }
      },

      refreshMachines: async () => {
        const { currentFilters } = get();
        set({ isRefreshing: true });

        try {
          const response = await getMachinesAction(currentFilters);

          if (response.success && response.machines) {
            set({
              machines: response.machines,
              pagination: response.pagination || null,
              isRefreshing: false,
              error: null,
            });
          } else if (isSessionExpiredError(response.error)) {
            set({ isRefreshing: false });
            handleSessionExpired();
          } else {
            set({
              error: response.error || 'Error al actualizar máquinas',
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

      setFilters: (filters: MachinesFilters) => {
        set({ currentFilters: filters });
      },

      initializeMachines: (machines: Machine[], pagination?: { links: PaginationLinks; meta: PaginationMeta }) => {
        set({
          machines,
          pagination: pagination || null,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      clearMachineError: () => {
        set({ machineError: null });
      },

      clearSelectedMachine: () => {
        set({ selectedMachine: null, machineError: null });
      },

      reset: () => {
        set({
          machines: [],
          selectedMachine: null,
          currentFilters: {},
          pagination: null,
          globalStats: null,
          error: null,
          machineError: null,
          deleteError: null,
          updateError: null,
          createError: null,
        });
      },

      createMachine: async (machineData: CreateMachineFormData) => {
        set({ isCreating: true, createError: null });

        try {
          const response = await createMachineAction(machineData);

          if (response.success && response.machine) {
            const { machines, pagination } = get();
            const updatedMachines = [response.machine, ...machines];

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
              machines: updatedMachines,
              pagination: updatedPagination,
              isCreating: false,
              createError: null,
            });

            return true;
          } else {
            set({
              createError: response.error || "Error al crear máquina",
              isCreating: false,
            });
            return false;
          }
        } catch (error) {
          set({
            createError:
              error instanceof Error ? error.message : "Error inesperado",
            isCreating: false,
          });
          return false;
        }
      },

      deleteMachine: async (machineId: string | number) => {
        const { machines } = get();

        // Optimistic update: remove machine from local state immediately
        const machineToDelete = machines.find(m => m.id === machineId);
        if (!machineToDelete) {
          set({ deleteError: 'Máquina no encontrada' });
          return false;
        }

        const optimisticMachines = machines.filter(m => m.id !== machineId);

        set({
          machines: optimisticMachines,
          isDeleting: true,
          deleteError: null
        });

        try {
          const response = await deleteMachineAction(machineId);

          if (response.success) {
            // Success: keep the optimistic update and update pagination
            const { pagination } = get();
            const updatedPagination = pagination ? {
              ...pagination,
              meta: {
                ...pagination.meta,
                total: pagination.meta.total - 1
              }
            } : null;

            set({
              isDeleting: false,
              deleteError: null,
              pagination: updatedPagination
            });
            return true;
          } else {
            // Error: revert the optimistic update
            set({
              machines: machines, // Restore original machines
              isDeleting: false,
              deleteError: response.error || 'Error al eliminar máquina'
            });
            return false;
          }
        } catch (error) {
          // Error: revert the optimistic update
          set({
            machines: machines, // Restore original machines
            isDeleting: false,
            deleteError: error instanceof Error ? error.message : 'Error inesperado'
          });
          return false;
        }
      },

      clearDeleteError: () => {
        set({ deleteError: null });
      },

      clearCreateError: () => {
        set({ createError: null });
      },

      updateMachine: async (machineId: string | number, machineData: UpdateMachineFormData) => {
        const { machines } = get();

        // Optimistic update: find and update machine in local state immediately
        const machineIndex = machines.findIndex(m => m.id === machineId);
        if (machineIndex === -1) {
          set({ updateError: 'Máquina no encontrada' });
          return false;
        }

        const originalMachine = machines[machineIndex];
        const optimisticMachines = [...machines];
        // Update the machine with new data (merge with existing data)
        optimisticMachines[machineIndex] = { ...originalMachine, ...machineData };

        set({
          machines: optimisticMachines,
          isUpdating: true,
          updateError: null
        });

        try {
          const response = await updateMachineAction(machineId, machineData);

          if (response.success && response.machine) {
            // Success: update with real data from server
            const finalMachines = [...machines];
            finalMachines[machineIndex] = response.machine;

            set({
              machines: finalMachines,
              selectedMachine: response.machine, // Update selected machine if it's the same
              isUpdating: false,
              updateError: null
            });
            return true;
          } else {
            // Error: revert the optimistic update
            set({
              machines: machines, // Restore original machines
              isUpdating: false,
              updateError: response.error || 'Error al actualizar máquina'
            });
            return false;
          }
        } catch (error) {
          // Error: revert the optimistic update
          set({
            machines: machines, // Restore original machines
            isUpdating: false,
            updateError: error instanceof Error ? error.message : 'Error inesperado'
          });
          return false;
        }
      },

      clearUpdateError: () => {
        set({ updateError: null });
      },

      // Computed getters
      getTotalMachines: () => {
        const { pagination } = get();
        return pagination?.meta?.total || 0;
      },

      getFilteredMachinesCount: () => {
        const { machines } = get();
        return machines.length;
      },

      getTotalOnlineMachines: async () => {
        const { globalStats } = get();

        // Si tenemos stats en cache y son recientes (menos de 5 minutos), usarlas
        if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
          return globalStats.totalOnline;
        }

        // Si no, calcular desde todas las máquinas del servidor
        try {
          const response = await getMachinesAction({ status: 'online' });
          if (response.success && response.pagination?.meta) {
            const totalOnline = response.pagination.meta.total;

            // Actualizar cache
            set(state => ({
              globalStats: {
                ...state.globalStats,
                totalOnline,
                lastUpdated: Date.now(),
              } as typeof state.globalStats
            }));

            return totalOnline;
          }
        } catch (error) {
          console.error('Error getting total online machines:', error);
        }

        return 0;
      },

      getTotalOfflineMachines: async () => {
        const { globalStats } = get();

        if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
          return globalStats.totalOffline;
        }

        try {
          const response = await getMachinesAction({ status: 'offline' });
          if (response.success && response.pagination?.meta) {
            const totalOffline = response.pagination.meta.total;

            set(state => ({
              globalStats: {
                ...state.globalStats,
                totalOffline,
                lastUpdated: Date.now(),
              } as typeof state.globalStats
            }));

            return totalOffline;
          }
        } catch (error) {
          console.error('Error getting total offline machines:', error);
        }

        return 0;
      },

      getTotalConnectedMachines: async () => {
        const { globalStats } = get();

        if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
          return globalStats.totalConnected;
        }

        try {
          // Para máquinas conectadas, calculamos desde las máquinas actuales
          // ya que no hay filtro específico en la API para connection_status
          const { machines } = get();
          const totalConnected = machines.filter(m => m.connection_status).length;

          set(state => ({
            globalStats: {
              ...state.globalStats,
              totalConnected,
              lastUpdated: Date.now(),
            } as typeof state.globalStats
          }));

          return totalConnected;
        } catch (error) {
          console.error('Error getting total connected machines:', error);
        }

        return 0;
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
      name: 'machine-store',
      partialize: (state: MachineState) => ({
        machines: state.machines,
        pagination: state.pagination,
        currentFilters: state.currentFilters,
        globalStats: state.globalStats,
      }),
    }
  )
);