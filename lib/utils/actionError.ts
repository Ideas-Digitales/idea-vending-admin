import { AuthFetchError } from './authFetchError';

export function handleActionError(error: unknown): { success: false; error: string } {
  if (error instanceof AuthFetchError) {
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'NO_TOKEN') {
      return { success: false, error: 'SESSION_EXPIRED' };
    }
    return { success: false, error: error.message };
  }
  return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
}
