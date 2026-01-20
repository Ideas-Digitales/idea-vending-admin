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

  console.log('🔍 Usuario normalizado:', userRecord);
  console.log('🔍 mqtt_user recibido:', userRecord?.mqtt_user ?? userRecord?.mqttUser ?? null);

  const rawPermissions = (userRecord?.permissions ?? []) as unknown;

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
    : mapUserPermissions(
        (userRecord?.role as string) || (userRecord?.user_type as string) || (userRecord?.type as string) || 'admin'
      );

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
    role: mapUserRole(
      (userRecord?.role as string) || (userRecord?.user_type as string) || (userRecord?.type as string) || "admin"
    ),
    status: ((userRecord?.status as string) || 'active') as User['status'],
    permissions: resolvedPermissions,
    lastLogin: (userRecord?.last_login as string) || new Date().toISOString(),
    createdAt:
      (userRecord?.created_at as string) || (userRecord?.createdAt as string) || new Date().toISOString(),
    updatedAt:
      (userRecord?.updated_at as string) || (userRecord?.updatedAt as string) || new Date().toISOString(),
    roles: (userRecord?.roles as Array<{ name: string }>) || undefined,
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

    console.log('🚨 EMERGENCY: loginAction llamado');
    console.log('🚨 Credentials recibidas:', JSON.stringify(credentials, null, 2));
    console.log('🚨 Timestamp:', new Date().toISOString());
    console.trace('🚨 Stack trace del loginAction:');
    
    // STOP INMEDIATO si las credenciales están vacías
    if (!credentials || !credentials.email || !credentials.password || 
        credentials.email.trim() === '' || credentials.password.trim() === '') {
      console.log('🚨 EMERGENCY: Deteniendo login con credenciales vacías');
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

    console.log("Intentando login con:", { email: credentials.email, apiUrl });

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
    console.log("Respuesta de login:", { status: response.status, data });

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

    console.log(
      "Obteniendo info del usuario con token:",
      token.substring(0, 20) + "..."
    );

    const response = await fetch(`${apiUrl}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log(
        "Error al obtener usuario:",
        response.status,
        response.statusText
      );

      // Si no hay endpoint /user, crear usuario básico
      if (response.status === 404 && email) {
        const basicUser: User = {
          id: 1,
          email: email,
          name: email.split("@")[0],
          rut: "Sin RUT",
          role: "admin",
          status: "active",
          permissions: [
            "read",
            "write",
            "delete",
            "manage_users",
            "manage_machines",
            "view_reports",
            "manage_enterprises",
          ],
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          user: basicUser,
        };
      }

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
    console.log("Datos del usuario obtenidos:", userData);

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

    console.log('🔐 validateTokenAction: Verificando token...');
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

// Server Action para logout
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    // Intentar logout en la API
    if (token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl) {
          await fetch(`${apiUrl}/logout`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (error) {
        console.warn("Error al hacer logout en la API:", error);
      }
    }

    // Eliminar cookie
    cookieStore.delete("auth-token");

    return { success: true };
  } catch (error) {
    console.error("Error en logoutAction:", error);
    return { success: false };
  }
}

// Funciones auxiliares
function mapUserRole(apiRole: string): User['role'] {
  if (!apiRole) return "admin";

  const role = apiRole.toLowerCase();

  if (
    role.includes("admin") ||
    role.includes("administrator") ||
    role.includes("super")
  ) {
    return "admin";
  } else if (
    role.includes("operator") ||
    role.includes("manager") ||
    role.includes("mod")
  ) {
    return "operator";
  } else {
    return "viewer";
  }
}

function mapUserPermissions(apiRole: string): string[] {
  const role = mapUserRole(apiRole);

  switch (role) {
    case "admin":
      return [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_machines",
        "manage_enterprises",
        "view_reports",
      ];
    case "operator":
      return ["read", "write", "manage_machines", "view_reports"];
    case "viewer":
    default:
      return ["read", "view_reports"];
  }
}
