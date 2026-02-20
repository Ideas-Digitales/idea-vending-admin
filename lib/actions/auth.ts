"use server";

import { cookies } from "next/headers";
import type { User } from "@/lib/interfaces";
import type { MqttUser } from '@/lib/interfaces/machine.interface';
import { loopPrevention } from "@/lib/utils/loopPrevention";

// Re-export User for other modules
export type { User };

// Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

function mapApiUserResponseToUser(rawUser: unknown, fallbackEmail?: string): User {
  const normalizedUser =
    (rawUser && typeof rawUser === 'object' && 'user' in rawUser ? (rawUser as Record<string, unknown>).user : null) ??
    (rawUser && typeof rawUser === 'object' && 'data' in rawUser ? (rawUser as Record<string, unknown>).data : null) ??
    rawUser ?? {};

  const userRecord = normalizedUser as Record<string, unknown>;

  const rawPermissions = (userRecord?.permissions ?? []) as unknown;

  const resolveRoleSource = (): string | null => {
    // Priorizar roles[] (spatie/laravel-permission) sobre el campo role directo
    const rolesCollection = userRecord?.roles as unknown;
    if (Array.isArray(rolesCollection) && rolesCollection.length > 0) {
      for (const entry of rolesCollection) {
        if (typeof entry === 'string' && entry.trim().length > 0) {
          return entry;
        }

        if (entry && typeof entry === 'object' && 'name' in entry) {
          const name = (entry as { name?: unknown }).name;
          if (typeof name === 'string' && name.trim().length > 0) {
            return name;
          }
        }
      }
    }

    // Fallback al campo role directo solo si no hay roles[]
    const directRole =
      (userRecord?.role as string | undefined) ||
      (userRecord?.user_type as string | undefined) ||
      (userRecord?.type as string | undefined);

    if (directRole && directRole.trim().length > 0) {
      return directRole;
    }

    return null;
  };

  const normalizedRoles = Array.isArray(userRecord?.roles)
    ? (userRecord?.roles as unknown[])
        .map((entry) => {
          if (typeof entry === 'string' && entry.trim().length > 0) {
            return { name: entry };
          }

          if (entry && typeof entry === 'object' && 'name' in entry) {
            const name = (entry as { name?: unknown }).name;
            if (typeof name === 'string' && name.trim().length > 0) {
              return { name };
            }
          }

          return null;
        })
        .filter((role): role is { name: string } => Boolean(role))
    : undefined;

  const resolvedRoleSource = resolveRoleSource() ?? 'technician';

  const resolvedPermissions: string[] = Array.isArray(rawPermissions)
    ? ((rawPermissions as unknown[])
        .map((permission) => {
          if (typeof permission === 'string') {
            return permission;
          }
          if (
            permission &&
            typeof permission === 'object' &&
            'name' in permission &&
            typeof (permission as { name?: unknown }).name === 'string'
          ) {
            return (permission as { name: string }).name;
          }
          return null;
        })
        .filter((permission: string | null): permission is string => Boolean(permission)) ?? [])
    : [];

  const resolvedEmail = (userRecord?.email as string) || fallbackEmail || "usuario@ejemplo.com";

  return {
    id: typeof userRecord?.id === 'number'
      ? (userRecord.id as number)
      : (typeof userRecord?.user_id === 'number' ? (userRecord.user_id as number) : 1),
    email: resolvedEmail,
    name:
      (userRecord?.name as string) ||
      (userRecord?.full_name as string) ||
      (userRecord?.username as string) ||
      resolvedEmail.split("@")[0] ||
      "Usuario",
    rut: (userRecord?.rut as string) || "Sin RUT",
    role: mapUserRole(resolvedRoleSource),
    status: ((userRecord?.status as string) || 'active') as User['status'],
    permissions: resolvedPermissions,
    lastLogin: (userRecord?.last_login as string) || new Date().toISOString(),
    createdAt:
      (userRecord?.created_at as string) || (userRecord?.createdAt as string) || new Date().toISOString(),
    updatedAt:
      (userRecord?.updated_at as string) || (userRecord?.updatedAt as string) || new Date().toISOString(),
    roles: normalizedRoles,
    enterprises: (userRecord?.enterprises as Array<{ id: number; name: string }>) || undefined,
    mqtt_user:
      (userRecord?.mqtt_user as MqttUser | null) ??
      (userRecord?.mqttUser as MqttUser | null) ??
      null,
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Server Action para login
export async function loginAction(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    // MECANISMO DE EMERGENCIA: Prevenir loops infinitos
    if (loopPrevention.shouldPreventCall('loginAction')) {
      return {
        success: false,
        error: "Loop prevention: Demasiadas llamadas a loginAction",
      };
    }

    // STOP INMEDIATO si las credenciales están vacías
    if (!credentials || !credentials.email || !credentials.password ||
        credentials.email.trim() === '' || credentials.password.trim() === '') {
      return {
        success: false,
        error: "Credenciales vacías - deteniendo loop",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: "API URL no configurada en variables de entorno",
      };
    }

    const response = await fetch(`${apiUrl}/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          `Error ${response.status}: ${response.statusText}`,
      };
    }

    // Extraer token de la respuesta
    const token = data.token || data.access_token || data.accessToken;

    if (!token) {
      return {
        success: false,
        error: "Token no encontrado en la respuesta del servidor",
      };
    }

    const cookieStore = await cookies();
    const persistToken = () => {
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      });
    };

    const inlineUserPayload =
      data.user ?? data.data ?? (typeof data.id === 'number' && data.email ? data : null);

    if (inlineUserPayload) {
      const user = mapApiUserResponseToUser(inlineUserPayload, credentials.email);
      persistToken();
      return {
        success: true,
        token,
        user,
      };
    }

    // Obtener información del usuario mediante endpoint dedicado como fallback
    const userInfo = await getUserInfo(token, credentials.email);

    if (!userInfo.success || !userInfo.user) {
      return {
        success: false,
        error: userInfo.error || "Error al obtener información del usuario",
      };
    }

    persistToken();

    return {
      success: true,
      token,
      user: userInfo.user,
    };
  } catch (error) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error de conexión con el servidor",
    };
  }
}

// Server Action para obtener información del usuario
export async function getUserInfo(
  token: string,
  email?: string
): Promise<AuthResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: "API URL no configurada",
      };
    }

    const response = await fetch(`${apiUrl}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          errorData.error ||
          "Error al obtener información del usuario",
      };
    }

    const userData = await response.json();
    const user = mapApiUserResponseToUser(userData, email);

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error en getUserInfo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener información del usuario",
    };
  }
}

// Server Action para validar token
export async function validateTokenAction(): Promise<AuthResponse> {
  try {
    // MECANISMO DE EMERGENCIA: Prevenir loops infinitos
    if (loopPrevention.shouldPreventCall('validateTokenAction')) {
      return {
        success: false,
        error: "Loop prevention: Demasiadas llamadas a validateTokenAction",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return {
        success: false,
        error: "No hay token de autenticación",
      };
    }

    const userInfo = await getUserInfo(token);

    if (userInfo.success) {
      return {
        success: true,
        token,
        user: userInfo.user,
      };
    }

    // Si el token no es válido, eliminarlo
    cookieStore.delete("auth-token");
    return {
      success: false,
      error: "Token inválido o expirado",
    };
  } catch (error) {
    console.error("Error en validateTokenAction:", error);
    return {
      success: false,
      error: "Error al validar token",
    };
  }
}

// Server Action para verificar validez del token (lightweight)
export async function checkTokenAction(): Promise<{ valid: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return { valid: false, error: "No hay token de autenticación" };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return { valid: false, error: "API URL no configurada" };
    }

    const response = await fetch(`${apiUrl}/token/check`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    // Token inválido o expirado — eliminar cookie
    if (response.status === 401) {
      cookieStore.delete("auth-token");
      return { valid: false, error: "Token inválido o expirado" };
    }

    return { valid: false, error: `Error ${response.status} al verificar token` };
  } catch (error) {
    return { valid: false, error: "Error al verificar token" };
  }
}

// Server Action para logout
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    // Eliminar cookie primero (operación local, instantánea)
    // Esto garantiza que el token quede invalidado localmente
    // independientemente de lo que pase con la API
    cookieStore.delete("auth-token");

    // Notificar a la API con timeout de 2 segundos (best-effort)
    // Si la API tarda o falla, la cookie ya fue eliminada — no bloqueamos
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch(`${apiUrl}/logout`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });
        } catch {
          // Timeout o error de red — ignorar, la cookie ya fue eliminada
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error en logoutAction:", error);
    return { success: false };
  }
}

// Funciones auxiliares
function mapUserRole(apiRole: string): User['role'] {
  if (!apiRole) return "technician";

  const role = apiRole.toLowerCase();

  if (
    role.includes("admin") ||
    role.includes("administrator") ||
    role.includes("super")
  ) {
    return "admin";
  }

  if (role.includes("customer") || role.includes("client")) {
    return "customer";
  }

  if (role.includes("technician") || role.includes("tech") || role.includes("support")) {
    return "technician";
  }

  return "technician";
}
