"use server";

import { cookies } from "next/headers";
import { User } from "@/lib/interfaces/user.interface";

// Re-export User for other modules
export type { User };

// Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
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

    // Obtener información del usuario
    const userInfo = await getUserInfo(token, credentials.email);

    if (!userInfo.success) {
      return {
        success: false,
        error: userInfo.error || "Error al obtener información del usuario",
      };
    }

    // Guardar token en cookies httpOnly
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

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

    // Mapear datos del usuario según la estructura de la API
    const user: User = {
      id: userData.id?.toString() || userData.user_id?.toString() || "1",
      email: userData.email || email || "usuario@ejemplo.com",
      name:
        userData.name ||
        userData.full_name ||
        userData.username ||
        userData.email?.split("@")[0] ||
        "Usuario",
      rut: userData.rut || "Sin RUT",
      role: mapUserRole(
        userData.role || userData.user_type || userData.type || "admin"
      ),
      status: "active",
      permissions: mapUserPermissions(
        userData.role || userData.user_type || userData.type || "admin"
      ),
      lastLogin: new Date().toISOString(),
      createdAt:
        userData.created_at || userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updated_at || userData.updatedAt || new Date().toISOString(),
    };

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
function mapUserRole(apiRole: string): "admin" | "operator" | "viewer" {
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
