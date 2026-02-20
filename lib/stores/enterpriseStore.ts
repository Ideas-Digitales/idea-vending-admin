import { create } from 'zustand';
import {
  Enterprise,
  EnterprisesFilters,
  PaginationMeta,
  PaginationLinks,
} from '../interfaces/enterprise.interface';
import { isSessionExpiredError, handleSessionExpired } from '../utils/sessionErrorHandler';
import {
  getEnterprisesAction,
  getEnterpriseAction,
  createEnterpriseAction,
  updateEnterpriseAction,
  deleteEnterpriseAction,
} from '../actions/enterprise';
import { CreateEnterpriseFormData, UpdateEnterpriseFormData } from '../schemas/enterprise.schema';

interface EnterpriseState {
  // Estado de datos
  enterprises: Enterprise[];
  selectedEnterprise: Enterprise | null;
  pagination: {
    meta: PaginationMeta;
    links: PaginationLinks;
  } | null;

  // Estados de carga
  isLoading: boolean;
  isLoadingEnterprise: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Estados de error
  error: string | null;
  enterpriseError: string | null;
  updateError: string | null;
  deleteError: string | null;

  // Filtros actuales
  currentFilters: EnterprisesFilters;

  // Acciones
  fetchEnterprises: (filters?: EnterprisesFilters) => Promise<void>;
  fetchEnterprise: (enterpriseId: string | number) => Promise<void>;
  createEnterprise: (enterpriseData: CreateEnterpriseFormData) => Promise<boolean>;
  updateEnterprise: (enterpriseId: string | number, enterpriseData: UpdateEnterpriseFormData) => Promise<boolean>;
  deleteEnterprise: (enterpriseId: string | number) => Promise<boolean>;
  clearSelectedEnterprise: () => void;
  clearEnterpriseError: () => void;
  clearErrors: () => void;
  setFilters: (filters: EnterprisesFilters) => void;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  // Estado inicial
  enterprises: [],
  selectedEnterprise: null,
  pagination: null,
  isLoading: false,
  isLoadingEnterprise: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  enterpriseError: null,
  updateError: null,
  deleteError: null,
  currentFilters: {},

  // Obtener lista de empresas
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
      } else if (isSessionExpiredError(response.error)) {
        set({ isLoading: false });
        handleSessionExpired();
      } else {
        set({
          enterprises: [],
          pagination: null,
          isLoading: false,
          error: response.error || 'Error al cargar empresas',
        });
      }
    } catch (error) {
      console.error('Error en fetchEnterprises:', error);
      set({
        enterprises: [],
        pagination: null,
        isLoading: false,
        error: 'Error de conexión al cargar empresas',
      });
    }
  },

  // Obtener una empresa específica
  fetchEnterprise: async (enterpriseId: string | number) => {
    set({ isLoadingEnterprise: true, enterpriseError: null, selectedEnterprise: null });

    try {
      const response = await getEnterpriseAction(enterpriseId);

      if (response.success && response.enterprise) {
        set({
          selectedEnterprise: response.enterprise,
          isLoadingEnterprise: false,
          enterpriseError: null,
        });
      } else if (isSessionExpiredError(response.error)) {
        set({ isLoadingEnterprise: false });
        handleSessionExpired();
      } else {
        set({
          selectedEnterprise: null,
          isLoadingEnterprise: false,
          enterpriseError: response.error || 'Error al cargar empresa',
        });
      }
    } catch (error) {
      console.error('Error en fetchEnterprise:', error);
      set({
        selectedEnterprise: null,
        isLoadingEnterprise: false,
        enterpriseError: 'Error de conexión al cargar empresa',
      });
    }
  },

  // Crear nueva empresa
  createEnterprise: async (enterpriseData: CreateEnterpriseFormData) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await createEnterpriseAction(enterpriseData);

      if (response.success && response.enterprise) {
        // Agregar la nueva empresa a la lista
        const { enterprises, pagination } = get();
        const newEnterprises = [response.enterprise, ...enterprises];
        
        set({
          enterprises: newEnterprises,
          selectedEnterprise: response.enterprise,
          isUpdating: false,
          updateError: null,
          // Actualizar el total en paginación si existe
          pagination: pagination ? {
            ...pagination,
            meta: {
              ...pagination.meta,
              total: pagination.meta.total + 1,
            },
          } : null,
        });

        return true;
      } else {
        set({
          isUpdating: false,
          updateError: response.error || 'Error al crear empresa',
        });
        return false;
      }
    } catch (error) {
      console.error('Error en createEnterprise:', error);
      set({
        isUpdating: false,
        updateError: 'Error de conexión al crear empresa',
      });
      return false;
    }
  },

  // Actualizar empresa
  updateEnterprise: async (enterpriseId: string | number, enterpriseData: UpdateEnterpriseFormData) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await updateEnterpriseAction(enterpriseId, enterpriseData);

      if (response.success && response.enterprise) {
        // Actualizar en la lista
        const { enterprises, selectedEnterprise } = get();
        const updatedEnterprises = enterprises.map(enterprise =>
          enterprise.id === response.enterprise!.id ? response.enterprise! : enterprise
        );

        set({
          enterprises: updatedEnterprises,
          selectedEnterprise: selectedEnterprise?.id === response.enterprise.id 
            ? response.enterprise 
            : selectedEnterprise,
          isUpdating: false,
          updateError: null,
        });

        return true;
      } else {
        set({
          isUpdating: false,
          updateError: response.error || 'Error al actualizar empresa',
        });
        return false;
      }
    } catch (error) {
      console.error('Error en updateEnterprise:', error);
      set({
        isUpdating: false,
        updateError: 'Error de conexión al actualizar empresa',
      });
      return false;
    }
  },

  // Eliminar empresa
  deleteEnterprise: async (enterpriseId: string | number) => {
    set({ isDeleting: true, deleteError: null });

    try {
      // Actualización optimista
      const { enterprises, pagination } = get();
      const originalEnterprises = [...enterprises];
      const filteredEnterprises = enterprises.filter(enterprise => enterprise.id !== enterpriseId);
      
      set({ enterprises: filteredEnterprises });

      const response = await deleteEnterpriseAction(enterpriseId);

      if (response.success) {
        set({
          isDeleting: false,
          deleteError: null,
          selectedEnterprise: null,
          // Actualizar el total en paginación si existe
          pagination: pagination ? {
            ...pagination,
            meta: {
              ...pagination.meta,
              total: Math.max(0, pagination.meta.total - 1),
            },
          } : null,
        });

        return true;
      } else {
        // Revertir actualización optimista
        set({
          enterprises: originalEnterprises,
          isDeleting: false,
          deleteError: response.error || 'Error al eliminar empresa',
        });
        return false;
      }
    } catch (error) {
      console.error('Error en deleteEnterprise:', error);
      // Revertir actualización optimista
      set({
        isDeleting: false,
        deleteError: 'Error de conexión al eliminar empresa',
      });
      return false;
    }
  },

  // Limpiar empresa seleccionada
  clearSelectedEnterprise: () => {
    set({ selectedEnterprise: null, enterpriseError: null });
  },

  // Limpiar error específico de empresa
  clearEnterpriseError: () => {
    set({ enterpriseError: null });
  },

  // Limpiar errores
  clearErrors: () => {
    set({ error: null, enterpriseError: null, updateError: null, deleteError: null });
  },

  // Establecer filtros
  setFilters: (filters: EnterprisesFilters) => {
    set({ currentFilters: filters });
  },
}));
