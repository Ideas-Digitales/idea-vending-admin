import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UsersFilters, Pagination, PaginationLinks, PaginationMeta } from '../interfaces/user.interface';
import { getUsersAction, getUserAction, deleteUserAction, updateUserAction } from '../actions/users';
import type { EditUserFormData } from '../schemas/user.schema';

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
  isDeleting: boolean;
  isUpdating: boolean;
  
  // Error states
  error: string | null;
  userError: string | null;
  deleteError: string | null;
  updateError: string | null;
  
  // Actions
  fetchUsers: (filters?: UsersFilters) => Promise<void>;
  fetchUser: (userId: string | number) => Promise<void>;
  refreshUsers: () => Promise<void>;
  deleteUser: (userId: string | number) => Promise<boolean>;
  updateUser: (userId: string | number, userData: EditUserFormData) => Promise<boolean>;
  setFilters: (filters: UsersFilters) => void;
  initializeUsers: (users: User[], pagination?: Pagination) => void;
  clearError: () => void;
  clearUserError: () => void;
  clearDeleteError: () => void;
  clearUpdateError: () => void;
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
  // Initial state
  users: [],
  selectedUser: null,
  currentFilters: {},
  pagination: null,
  globalStats: null,
  isLoading: false,
  isLoadingUser: false,
  isRefreshing: false,
  isDeleting: false,
  isUpdating: false,
  error: null,
  userError: null,
  deleteError: null,
  updateError: null,

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

  initializeUsers: (users: User[], pagination?: Pagination) => {
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

  deleteUser: async (userId: string | number) => {
    const { users } = get();
    
    // Optimistic update: remove user from local state immediately
    const userToDelete = users.find(u => u.id === Number(userId));
    if (!userToDelete) {
      set({ deleteError: 'Usuario no encontrado' });
      return false;
    }

    const optimisticUsers = users.filter(u => u.id !== Number(userId));
    
    set({ 
      users: optimisticUsers, 
      isDeleting: true, 
      deleteError: null 
    });

    try {
      const response = await deleteUserAction(userId);
      
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
          users: users, // Restore original users
          isDeleting: false,
          deleteError: response.error || 'Error al eliminar usuario' 
        });
        return false;
      }
    } catch (error) {
      // Error: revert the optimistic update
      set({ 
        users: users, // Restore original users
        isDeleting: false,
        deleteError: error instanceof Error ? error.message : 'Error inesperado' 
      });
      return false;
    }
  },

  clearDeleteError: () => {
    set({ deleteError: null });
  },

  updateUser: async (userId: string | number, userData: EditUserFormData) => {
    const { users } = get();
    
    // Optimistic update: find and update user in local state immediately
    const userIndex = users.findIndex(u => u.id === Number(userId));
    if (userIndex === -1) {
      set({ updateError: 'Usuario no encontrado' });
      return false;
    }

    const originalUser = users[userIndex];
    const optimisticUsers = [...users];
    // Update the user with new data (merge with existing data)
    optimisticUsers[userIndex] = { ...originalUser, ...userData };
    
    set({ 
      users: optimisticUsers, 
      isUpdating: true, 
      updateError: null 
    });

    try {
      const response = await updateUserAction(userId, userData);
      
      if (response.success && response.user) {
        // Success: update with real data from server
        const finalUsers = [...users];
        finalUsers[userIndex] = response.user;
        
        set({ 
          users: finalUsers,
          selectedUser: response.user, // Update selected user if it's the same
          isUpdating: false,
          updateError: null 
        });
        return true;
      } else {
        // Error: revert the optimistic update
        set({ 
          users: users, // Restore original users
          isUpdating: false,
          updateError: response.error || 'Error al actualizar usuario' 
        });
        return false;
      }
    } catch (error) {
      // Error: revert the optimistic update
      set({ 
        users: users, // Restore original users
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
}),
    {
      name: 'user-store',
      partialize: (state) => ({
        // users no se persiste — siempre se obtienen frescos del servidor
        pagination: state.pagination,
        currentFilters: state.currentFilters,
        globalStats: state.globalStats,
      }),
    }
  )
);
