import { create } from "zustand";
import { User, UsersFilters, PaginationLinks, PaginationMeta } from "../interfaces";
import { getUsersAction, getUserAction } from "../actions/users";

interface UserState {
  // Data state
  users: User[];
  selectedUser: User | null;
  currentFilters: UsersFilters;
  
  // Pagination state
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  } | null;
  
  // Global stats cache
  globalStats: {
    totalActive: number;
    totalAdmins: number;
    totalInactive: number;
    lastUpdated: number;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingUser: boolean;
  isRefreshing: boolean;
  
  // Error states
  error: string | null;
  userError: string | null;
  
  // Actions
  fetchUsers: (filters?: UsersFilters) => Promise<void>;
  fetchUser: (userId: string | number) => Promise<void>;
  refreshUsers: () => Promise<void>;
  setFilters: (filters: UsersFilters) => void;
  initializeUsers: (users: User[], pagination?: any) => void;
  clearError: () => void;
  clearUserError: () => void;
  clearSelectedUser: () => void;
  
  // Computed getters
  getTotalUsers: () => number;
  getFilteredUsersCount: () => number;
  getTotalActiveUsers: () => Promise<number>;
  getTotalAdminUsers: () => Promise<number>;
  getTotalInactiveUsers: () => Promise<number>;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export const useUserStore = create<UserState>()((set, get) => ({
  // Initial state
  users: [],
  selectedUser: null,
  currentFilters: {},
  pagination: null,
  globalStats: null,
  isLoading: false,
  isLoadingUser: false,
  isRefreshing: false,
  error: null,
  userError: null,

  // Actions
  fetchUsers: async (filters?: UsersFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await getUsersAction(filters);
      
      if (response.success && response.users) {
        set({
          users: response.users,
          pagination: response.pagination || null,
          currentFilters: filters || {},
          isLoading: false,
          error: null,
        });
      } else {
        set({
          error: response.error || 'Error al cargar usuarios',
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

  fetchUser: async (userId: string | number) => {
    set({ isLoadingUser: true, userError: null });
    
    try {
      const response = await getUserAction(userId);
      
      if (response.success && response.user) {
        set({
          selectedUser: response.user,
          isLoadingUser: false,
          userError: null,
        });
      } else {
        set({
          userError: response.error || 'Error al cargar usuario',
          isLoadingUser: false,
        });
      }
    } catch (error) {
      set({
        userError: error instanceof Error ? error.message : 'Error inesperado',
        isLoadingUser: false,
      });
    }
  },

  refreshUsers: async () => {
    const { currentFilters } = get();
    set({ isRefreshing: true });
    
    try {
      const response = await getUsersAction(currentFilters);
      
      if (response.success && response.users) {
        set({
          users: response.users,
          pagination: response.pagination || null,
          isRefreshing: false,
          error: null,
        });
      } else {
        set({
          error: response.error || 'Error al actualizar usuarios',
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

  setFilters: (filters: UsersFilters) => {
    set({ currentFilters: filters });
  },

  initializeUsers: (users: User[], pagination?: any) => {
    set({
      users,
      pagination: pagination || null,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearUserError: () => {
    set({ userError: null });
  },

  clearSelectedUser: () => {
    set({ selectedUser: null, userError: null });
  },

  // Computed getters
  getTotalUsers: () => {
    const { pagination } = get();
    return pagination?.meta?.total || 0;
  },

  getFilteredUsersCount: () => {
    const { users } = get();
    return users.length;
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
  getTotalActiveUsers: async () => {
    const { globalStats } = get();
    
    // Si tenemos stats en cache y son recientes (menos de 5 minutos), usarlas
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalActive;
    }

    // Si no, calcular desde todos los usuarios del servidor
    try {
      const response = await getUsersAction({ status: 'active' });
      if (response.success && response.pagination?.meta) {
        const totalActive = response.pagination.meta.total;
        
        // Actualizar cache
        set(state => ({
          globalStats: {
            ...state.globalStats,
            totalActive,
            lastUpdated: Date.now(),
          } as typeof state.globalStats
        }));
        
        return totalActive;
      }
    } catch (error) {
      console.error('Error getting total active users:', error);
    }
    
    return 0;
  },

  getTotalAdminUsers: async () => {
    const { globalStats } = get();
    
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalAdmins;
    }

    try {
      const response = await getUsersAction({ role: 'admin' });
      if (response.success && response.pagination?.meta) {
        const totalAdmins = response.pagination.meta.total;
        
        set(state => ({
          globalStats: {
            ...state.globalStats,
            totalAdmins,
            lastUpdated: Date.now(),
          } as typeof state.globalStats
        }));
        
        return totalAdmins;
      }
    } catch (error) {
      console.error('Error getting total admin users:', error);
    }
    
    return 0;
  },

  getTotalInactiveUsers: async () => {
    const { globalStats } = get();
    
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalInactive;
    }

    try {
      const response = await getUsersAction({ status: 'inactive' });
      if (response.success && response.pagination?.meta) {
        const totalInactive = response.pagination.meta.total;
        
        set(state => ({
          globalStats: {
            ...state.globalStats,
            totalInactive,
            lastUpdated: Date.now(),
          } as typeof state.globalStats
        }));
        
        return totalInactive;
      }
    } catch (error) {
      console.error('Error getting total inactive users:', error);
    }
    
    return 0;
  },
}));
