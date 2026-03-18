'use server';

import { getMachinesAction } from './machines';
import { getUsersAction } from './users';
import { getEnterpriseAction } from './enterprise';
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
export async function getDashboardStatsAction(enterpriseId?: number | null): Promise<DashboardResponse> {
  try {
    if (loopPrevention.shouldPreventCall('getDashboardStatsAction')) {
      return { success: false, error: "Loop prevention: Demasiadas llamadas a getDashboardStatsAction" };
    }

    const machineFilters = { limit: 1000, ...(enterpriseId ? { enterprise_id: enterpriseId } : {}) };

    if (enterpriseId) {
      // Filtrado por empresa: máquinas de esa empresa + usuarios desde el detalle de la empresa
      const [machinesResponse, enterpriseResponse] = await Promise.all([
        getMachinesAction(machineFilters),
        getEnterpriseAction(enterpriseId),
      ]);

      if (!machinesResponse.success) {
        return { success: false, error: `Error al obtener máquinas: ${machinesResponse.error}` };
      }

      const machines = machinesResponse.machines || [];
      const enterpriseUsers = enterpriseResponse.success ? (enterpriseResponse.enterprise?.users ?? []) : [];

      return {
        success: true,
        stats: {
          machines: {
            total:   machines.length,
            online:  machines.filter(m => m.status === 'online').length,
            offline: machines.filter(m => m.status !== 'online').length,
          },
          users: {
            total:       enterpriseUsers.length,
            active:      enterpriseUsers.length,
            admins:      0,
            technicians: 0,
          },
        },
      };
    }

    // Sin filtro: comportamiento original
    const [machinesResponse, usersResponse] = await Promise.all([
      getMachinesAction(machineFilters),
      getUsersAction({ limit: 1000 }),
    ]);

    if (!machinesResponse.success) {
      return { success: false, error: `Error al obtener máquinas: ${machinesResponse.error}` };
    }
    if (!usersResponse.success) {
      return { success: false, error: `Error al obtener usuarios: ${usersResponse.error}` };
    }

    const machines = machinesResponse.machines || [];
    const users    = usersResponse.users    || [];

    return {
      success: true,
      stats: {
        machines: {
          total:   machines.length,
          online:  machines.filter(m => m.status === 'online').length,
          offline: machines.filter(m => m.status !== 'online').length,
        },
        users: {
          total:       users.length,
          active:      users.filter(u => u.status === 'active').length,
          admins:      users.filter(u => u.role === 'admin').length,
          technicians: users.filter(u => u.role === 'technician').length,
        },
      },
    };

  } catch (error) {
    console.error('Error en getDashboardStatsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servidor',
    };
  }
}
