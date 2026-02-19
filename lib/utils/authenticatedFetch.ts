'use server';

import { cookies } from 'next/headers';
import { AuthFetchError } from './authFetchError';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthenticatedFetchResult {
  response: Response;
  token: string;
}

/**
 * Centraliza las llamadas autenticadas a la API.
 * - Obtiene el token de la cookie
 * - Si la API responde 401, elimina la cookie (token expirado/inválido)
 * - Lanza un error tipado para que el caller pueda reaccionar
 */
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<AuthenticatedFetchResult> {
  if (!API_URL) {
    throw new AuthFetchError('API URL no configurada', 'NO_API_URL');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new AuthFetchError('No hay token de autenticación', 'NO_TOKEN');
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // Token expirado o inválido — limpiar cookie
  if (response.status === 401) {
    cookieStore.delete('auth-token');
    throw new AuthFetchError('Sesión expirada', 'TOKEN_EXPIRED');
  }

  return { response, token };
}
