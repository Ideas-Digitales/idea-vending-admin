// Import interfaces from user.interface.ts
import type { 
  User, 
  UserApiData, 
  ApiUsersResponse, 
} from '@/lib/interfaces/user.interface';

// Adaptador para convertir datos de API a formato de aplicación
export class UserAdapter {
  static apiToApp(apiUser: UserApiData): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      rut: apiUser.rut,
      createdAt: apiUser.created_at,
      updatedAt: apiUser.updated_at,
      role: this.mapUserRole(apiUser.role),
      status: this.mapUserStatus(apiUser.status),
      lastLogin: apiUser.created_at, // Usando created_at como placeholder para lastLogin
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
