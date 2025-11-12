import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginAction, validateTokenAction, logoutAction, type LoginCredentials, type User } from '@/lib/actions/auth';

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
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

      // Acción de login
      login: async (credentials) => {
        console.log('🚨 STORE LOGIN LLAMADO');
        console.log('🚨 Credentials en store:', JSON.stringify(credentials, null, 2));
        console.trace('🚨 Stack trace del store login:');
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('Iniciando login desde store...');
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
              error: null
            });

            console.log('Login exitoso, usuario:', userWithLastLogin);
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: result.error || 'Error de autenticación'
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
            error: errorMessage
          });
          throw error;
        }
      },

      // Acción de logout
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await logoutAction();
          console.log('Logout exitoso');
        } catch (error) {
          console.warn('Error durante logout:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      },

      // Verificar autenticación
      checkAuth: async () => {
        const currentState = get();
        
        console.log('🔐 checkAuth llamado:', { 
          isAuthenticated: currentState.isAuthenticated, 
          hasUser: !!currentState.user,
          isLoading: currentState.isLoading 
        });
        
        // Si ya está autenticado, no verificar de nuevo
        if (currentState.isAuthenticated && currentState.user) {
          console.log('🔐 Usuario ya autenticado, saltando verificación');
          // Asegurar que isLoading esté en false
          if (currentState.isLoading) {
            set({ isLoading: false });
          }
          return;
        }

        // Si ya está cargando, no hacer otra verificación
        if (currentState.isLoading) {
          console.log('🔐 Ya está verificando, saltando...');
          return;
        }

        console.log('🔐 Iniciando verificación de autenticación...');
        set({ isLoading: true });

        try {
          console.log('🔐 Llamando validateTokenAction...');
          const result = await validateTokenAction();
          
          if (result.success && result.user && result.token) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            console.log('Autenticación válida, usuario:', result.user);
          } else {
            // Solo limpiar el estado si realmente no hay token válido
            console.log('No hay sesión válida');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Error en checkAuth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Actualizar datos del usuario
      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
          console.log('Usuario actualizado:', updatedUser);
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
