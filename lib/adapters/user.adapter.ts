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
      lastLogin: apiUser.created_at || new Date().toISOString(), // Usando created_at como placeholder para lastLogin
      permissions: this.mapUserPermissions(apiUser.role),
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

  private static mapUserRole(apiRole: string): 'admin' | 'operator' | 'viewer' | 'No role' {
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

  private static mapUserPermissions(apiRole: string): string[] {
    const role = this.mapUserRole(apiRole);
    
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_machines', 'view_reports'];
      case 'operator':
        return ['read', 'write', 'manage_machines', 'view_reports'];
      case 'viewer':
        return ['read', 'view_reports'];
      case 'No role':
        return ['No permissions'];
    }
  }
}
