import { useAuthStore } from '@/lib/stores/authStore';

const SESSION_ERROR_CODES = new Set(['SESSION_EXPIRED', 'NO_TOKEN']);

/**
 * Detecta si un error es de sesión expirada/inválida.
 */
export function isSessionExpiredError(error: string | null | undefined): boolean {
  return SESSION_ERROR_CODES.has(error ?? '');
}

/**
 * Invalida la sesión en el authStore.
 * Esto provoca que useAuthProtection detecte isAuthenticated: false
 * y redirija al login automáticamente.
 */
export function handleSessionExpired(): void {
  useAuthStore.getState().invalidateSession();
}
