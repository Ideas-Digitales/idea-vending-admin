'use server';

import { getMachinesAction } from './machines';
import { getUsersAction } from './users';
import { loopPrevention } from '@/lib/utils/loopPrevention';

export interface DashboardStats {
  machines: {
    total: number;
    online: number;
    offline: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    technicians: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}

// Server Action para obtener estadísticas del dashboard
export async function getDashboardStatsAction(): Promise<DashboardResponse> {
  try {
    // MECANISMO DE EMERGENCIA: Prevenir loops infinitos
    if (loopPrevention.shouldPreventCall('getDashboardStatsAction')) {
      return {
        success: false,
        error: "Loop prevention: Demasiadas llamadas a getDashboardStatsAction",
      };
    }

    console.log('🔄 getDashboardStatsAction: Iniciando carga de estadísticas...');
    
    // Obtener datos de máquinas y usuarios en paralelo
    const [machinesResponse, usersResponse] = await Promise.all([
      getMachinesAction({ limit: 1000 }), // Obtener todas las máquinas para estadísticas
      getUsersAction({ limit: 1000 }) // Obtener todos los usuarios para estadísticas
    ]);

    if (!machinesResponse.success) {
      return {
        success: false,
        error: `Error al obtener máquinas: ${machinesResponse.error}`
      };
    }

    if (!usersResponse.success) {
      return {
        success: false,
        error: `Error al obtener usuarios: ${usersResponse.error}`
      };
    }

    const machines = machinesResponse.machines || [];
    const users = usersResponse.users || [];

    // Calcular estadísticas de máquinas
    const machineStats = {
      total: machines.length,
      online: machines.filter(m => m.status === 'online').length,
      offline: machines.filter(m => m.status !== 'online').length,
    };

    // Calcular estadísticas de usuarios
    const userStats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      admins: users.filter(u => u.role === 'admin').length,
      technicians: users.filter(u => u.role === 'technician').length,
    };

    return {
      success: true,
      stats: {
        machines: machineStats,
        users: userStats,
      }
    };

  } catch (error) {
    console.error('Error en getDashboardStatsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}
