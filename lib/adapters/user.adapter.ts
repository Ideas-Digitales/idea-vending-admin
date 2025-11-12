import type { 
  User, 
  UserApiData, 
  ApiUsersResponse, 
} from '@/lib/interfaces/user.interface';

// Adaptador para convertir datos de API a formato de aplicación
export class UserAdapter {
  static apiToApp(apiUser: UserApiData): User {
    console.log('UserAdapter.apiToApp recibió:', apiUser);
    
    if (!apiUser || typeof apiUser !== 'object') {
      console.error('Datos de usuario inválidos:', apiUser);
      throw new Error('Datos de usuario inválidos');
    }
    
    if (!apiUser.id || !apiUser.name || !apiUser.email) {
      console.error('Faltan campos requeridos en usuario:', apiUser);
      throw new Error('Faltan campos requeridos en los datos del usuario');
    }
    
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      rut: apiUser.rut || 'Sin RUT',
      createdAt: apiUser.created_at || new Date().toISOString(),
      updatedAt: apiUser.updated_at || new Date().toISOString(),
      role: this.mapUserRole(apiUser.role),
      status: this.mapUserStatus(apiUser.status),
      lastLogin: apiUser.last_login || apiUser.created_at || new Date().toISOString(),
      permissions: this.mapUserPermissions(apiUser.role, apiUser.permissions),
      roles: apiUser.roles || undefined,
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

  private static mapUserRole(apiRole: string): 'admin' | 'operator' | 'viewer' | 'customer' | 'No role' {
    if (!apiRole) {
      return 'No role';
    }
    
    const role = apiRole.toString().toLowerCase();
    
    if (role.includes('admin') || role.includes('administrator') || role.includes('super')) {
      return 'admin';
    } else if (role.includes('operator') || role.includes('manager') || role.includes('mod')) {
      return 'operator';
    } else if (role.includes('viewer') || role.includes('view')) {
      return 'viewer';
    } else if (role.includes('customer') || role.includes('client')) {
      return 'customer';
    } else {
      return 'No role';
    }
  }

  private static mapUserStatus(apiStatus: string): 'active' | 'inactive' | 'No status' {
    if (!apiStatus) {
      return 'No status';
    }
    
    const status = apiStatus.toLowerCase();
    return status === 'active' || status === '1' || status === 'true' ? 'active' : 'inactive';
  }

  private static mapUserPermissions(apiRole: string, apiPermissions?: Array<{ name: string }> | string[]): string[] {
    // Si vienen permisos del API, usarlos
    if (apiPermissions && Array.isArray(apiPermissions)) {
      if (apiPermissions.length > 0) {
        // Si son objetos con name, extraer los nombres
        if (typeof apiPermissions[0] === 'object' && 'name' in apiPermissions[0]) {
          return (apiPermissions as Array<{ name: string }>).map(p => p.name);
        }
        // Si son strings directamente
        return apiPermissions as string[];
      }
    }
    
    // Fallback a permisos basados en rol
    const role = this.mapUserRole(apiRole);
    
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_machines', 'view_reports', 'manage_enterprises'];
      case 'operator':
        return ['read', 'write', 'manage_machines', 'view_reports'];
      case 'viewer':
        return ['read', 'view_reports'];
      case 'customer':
        return ['read', 'view_reports'];
      case 'No role':
        return ['No permissions'];
      default:
        return ['No permissions'];
    }
  }
}
