import type {
  User,
  UserApiData,
  ApiUsersResponse,
} from '@/lib/interfaces/user.interface';
import type { UserRole } from '@/lib/constants/roles';

export class UserAdapter {
  static apiToApp(apiUser: UserApiData): User {
    if (!apiUser || typeof apiUser !== 'object') {
      throw new Error('Datos de usuario inválidos');
    }

    if (!apiUser.id || !apiUser.name || !apiUser.email) {
      throw new Error('Faltan campos requeridos en los datos del usuario');
    }

    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      rut: apiUser.rut || 'Sin RUT',
      createdAt: apiUser.created_at || new Date().toISOString(),
      updatedAt: apiUser.updated_at || new Date().toISOString(),
      role: this.resolveRole(apiUser),
      status: this.mapUserStatus(apiUser.status),
      lastLogin: apiUser.last_login || apiUser.created_at || new Date().toISOString(),
      permissions: this.extractPermissions(apiUser.permissions),
      roles: (apiUser.roles && apiUser.roles.length > 0)
        ? apiUser.roles
        : this.rolesFromSingleRole(apiUser.role),
      enterprises: apiUser.enterprises || undefined,
    };
  }

  static apiUsersToApp(apiResponse: ApiUsersResponse): User[] {
    const usersArray = apiResponse.users || apiResponse.data || [];

    if (!Array.isArray(usersArray)) {
      console.warn('Los datos de usuarios no están en formato de array:', apiResponse);
      return [];
    }

    return usersArray.map(user => this.apiToApp(user));
  }

  // Cuando la API devuelve un objeto "role" singular en vez del array "roles"
  private static rolesFromSingleRole(role?: string | { name: string }): Array<{ name: string }> | undefined {
    if (!role) return undefined;
    const name = typeof role === 'string' ? role : role.name;
    return name ? [{ name }] : undefined;
  }

  private static resolveRole(apiUser: UserApiData): UserRole {
    console.log(`🎭 resolveRole [${apiUser.id}] raw:`, JSON.stringify({ role: apiUser.role, roles: apiUser.roles }));
    // Priorizar el campo "role" directo ya que es el que se actualiza en la API
    if (apiUser.role) {
      const directRole = typeof apiUser.role === 'string' ? apiUser.role : apiUser.role.name;
      if (directRole) {
        return this.mapUserRole(directRole);
      }
    }

    // Como fallback, usar la primera entrada en roles[] si existe
    if (Array.isArray(apiUser.roles) && apiUser.roles.length > 0) {
      const firstRole = apiUser.roles[0];
      const roleName = typeof firstRole === 'string' ? firstRole : firstRole?.name;
      if (roleName) {
        return this.mapUserRole(roleName);
      }
    }

    return 'technician';
  }

  private static mapUserRole(apiRole: string): UserRole {
    if (!apiRole) {
      return 'technician';
    }

    const role = apiRole.toString().toLowerCase();

    if (role.includes('admin') || role.includes('administrator') || role.includes('super')) {
      return 'admin';
    } else if (role.includes('customer') || role.includes('client')) {
      return 'customer';
    } else if (role.includes('technician') || role.includes('tech') || role.includes('support')) {
      return 'technician';
    } else {
      return 'technician';
    }
  }

  private static mapUserStatus(apiStatus: string): 'active' | 'inactive' | 'No status' {
    if (!apiStatus) {
      return 'No status';
    }

    const status = apiStatus.toLowerCase();
    return status === 'active' || status === '1' || status === 'true' ? 'active' : 'inactive';
  }

  private static extractPermissions(apiPermissions?: Array<{ name: string }> | string[]): string[] {
    if (!apiPermissions || !Array.isArray(apiPermissions) || apiPermissions.length === 0) {
      return [];
    }

    if (typeof apiPermissions[0] === 'object' && 'name' in apiPermissions[0]) {
      return (apiPermissions as Array<{ name: string }>).map(p => p.name);
    }

    return apiPermissions as string[];
  }
}
