import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginAction, logoutAction, checkTokenAction, type LoginCredentials, type User } from '@/lib/actions/auth';
import { resetAllDataStores } from './storeReset';

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasValidatedSession: boolean;
  lastSessionCheck: number | null;

  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  invalidateSession: () => void;
  clearError: () => void;
  checkAuth: (options?: { force?: boolean }) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasValidatedSession: false,
      lastSessionCheck: null,

      // Acción de login
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const result = await loginAction(credentials);

          if (result.success && result.user && result.token) {
            const userWithLastLogin = {
              ...result.user,
              lastLogin: new Date().toISOString(),
            };

            set({
              user: userWithLastLogin,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              hasValidatedSession: true,
              lastSessionCheck: Date.now()
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: result.error || 'Error de autenticación',
              hasValidatedSession: false,
              lastSessionCheck: null
            });
            throw new Error(result.error || 'Error de autenticación');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
          console.error('Error en login:', errorMessage);
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
            hasValidatedSession: false,
            lastSessionCheck: null
          });
          throw error;
        }
      },

      // Acción de logout
      logout: async () => {
        // 1. Limpiar estado local inmediatamente (sin poner isLoading: true,
        //    para no bloquear la UI con un spinner infinito si la API es lenta)
        resetAllDataStores();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          hasValidatedSession: false,
          lastSessionCheck: null
        });

        // 2. Eliminar cookie y notificar a la API (máximo 2 segundos)
        //    logoutAction() elimina la cookie primero y luego llama a la API con timeout
        try {
          await logoutAction();
        } catch (err) {
          console.warn('Error durante logoutAction:', err);
        }
      },

      // Invalidar sesión (token expirado mid-session, sin llamar API de logout)
      invalidateSession: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          hasValidatedSession: true,
          lastSessionCheck: Date.now(),
        });
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      },

      // Verificar autenticación
      checkAuth: async (options) => {
        const currentState = get();
        const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

        // Si no hay sesión local, marcar como no autenticado inmediatamente
        if (!currentState.user || !currentState.token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            hasValidatedSession: true,
            lastSessionCheck: Date.now()
          });
          return;
        }

        // Si ya verificamos recientemente (dentro del intervalo) y no es forzado, reutilizar resultado
        const now = Date.now();
        if (
          !options?.force &&
          currentState.hasValidatedSession &&
          currentState.lastSessionCheck &&
          now - currentState.lastSessionCheck < SESSION_CHECK_INTERVAL
        ) {
          // Estado ya es correcto, no actualizar para evitar re-renders innecesarios
          return;
        }

        // Verificar contra el servidor con el endpoint ligero
        set({ isLoading: true });
        const result = await checkTokenAction();

        if (result.valid) {
          set({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            hasValidatedSession: true,
            lastSessionCheck: Date.now()
          });
        } else if (result.reason === 'SERVER_ERROR') {
          // Error momentáneo del servidor o red — mantener sesión, no alertar
          set({ isLoading: false });
        } else {
          // NO_TOKEN o UNAUTHORIZED — limpiar sesión
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            hasValidatedSession: true,
            lastSessionCheck: Date.now()
          });
        }
      },

      // Actualizar datos del usuario
      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
        }
      },

      // Establecer estado de carga
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Hooks selectores para mejor performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Hook para acciones de auth
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  clearError: state.clearError,
  checkAuth: state.checkAuth,
  updateUser: state.updateUser,
  setLoading: state.setLoading,
}));
