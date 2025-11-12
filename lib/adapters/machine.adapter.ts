import type { Machine, ApiMachine, ApiMachinesResponse } from '../interfaces/machine.interface';

export class MachineAdapter {
  /**
   * Convierte una máquina de la API al formato de la aplicación
   */
  static apiToApp(apiMachine: ApiMachine): Machine {
    return {
      id: apiMachine.id || 0,
      name: apiMachine.name || apiMachine.machine_name || 'Máquina Sin Nombre',
      status: apiMachine.status || 'Inactive',
      is_enabled: Boolean(apiMachine.is_enabled ?? apiMachine.enabled ?? true),
      location: apiMachine.location || apiMachine.address || 'Ubicación no especificada',
      client_id: apiMachine.client_id || apiMachine.clientId || null,
      created_at: apiMachine.created_at || apiMachine.createdAt || new Date().toISOString(),
      updated_at: apiMachine.updated_at || apiMachine.updatedAt || new Date().toISOString(),
      type: apiMachine.type || apiMachine.machine_type || 'MDB-DEX',
      enterprise_id: apiMachine.enterprise_id || apiMachine.enterpriseId || 1,
      connection_status: Boolean(apiMachine.connection_status ?? apiMachine.connected ?? false),
      mqtt_user: apiMachine.mqtt_user || null,
    };
  }

  /**
   * Convierte un array de máquinas de la API al formato de la aplicación
   */
  static apiMachinesToApp(apiResponse: ApiMachinesResponse): Machine[] {
    // La API puede devolver las máquinas en diferentes estructuras
    const machinesArray = apiResponse.data || apiResponse.machines || apiResponse || [];

    if (!Array.isArray(machinesArray)) {
      console.warn('Los datos de máquinas no están en formato de array:', apiResponse);
      return [];
    }

    return machinesArray.map(machine => this.apiToApp(machine));
  }

  /**
   * Convierte una máquina de la aplicación al formato de la API
   */
  static appToApi(machine: Partial<Machine>): Record<string, any> {
    const apiMachine: Record<string, any> = {};

    if (machine.name !== undefined) apiMachine.name = machine.name;
    if (machine.location !== undefined) apiMachine.location = machine.location;
    if (machine.type !== undefined) apiMachine.type = machine.type;
    if (machine.status !== undefined) apiMachine.status = machine.status;
    if (machine.is_enabled !== undefined) apiMachine.is_enabled = machine.is_enabled;
    if (machine.client_id !== undefined) apiMachine.client_id = machine.client_id;
    if (machine.enterprise_id !== undefined) apiMachine.enterprise_id = machine.enterprise_id;

    return apiMachine;
  }

  /**
   * Mapea el estado de la máquina desde diferentes formatos de la API
   */
  private static mapMachineStatus(apiStatus: any): 'Active' | 'Inactive' | 'Maintenance' {
    if (!apiStatus) return 'Inactive';

    const status = apiStatus.toString().toLowerCase();

    if (status === 'active' || status === 'online' || status === 'running') {
      return 'Active';
    } else if (status === 'inactive' || status === 'offline' || status === 'outofservice') {
      return 'Inactive';
    } else if (status === 'maintenance' || status === 'repair' || status === 'service') {
      return 'Maintenance';
    } else {
      return 'Inactive';
    }
  }

  /**
   * Mapea filtros de la aplicación al formato esperado por la API
   */
  static mapFiltersToApi(filters: Record<string, any>): Record<string, any> {
    const apiFilters: Record<string, any> = {};

    if (filters.search) apiFilters.search = filters.search;
    if (filters.status) apiFilters.status = filters.status;
    if (filters.type) apiFilters.type = filters.type;
    if (filters.is_enabled !== undefined) apiFilters.is_enabled = filters.is_enabled;
    if (filters.enterprise_id) apiFilters.enterprise_id = filters.enterprise_id;
    if (filters.page) apiFilters.page = filters.page;
    if (filters.limit) apiFilters.limit = filters.limit;

    return apiFilters;
  }

  /**
   * Valida si una máquina tiene los campos mínimos requeridos
   */
  static validateMachine(machine: Partial<Machine>): boolean {
    return !!(machine.name && machine.location && machine.type);
  }

  /**
   * Obtiene el color del estado para la UI
   */
  static getStatusColor(status: string): string {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'outofservice':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el texto del estado traducido al español
   */
  static getStatusText(status: string): string {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'maintenance':
        return 'Mantenimiento';
      case 'outofservice':
        return 'Fuera de Servicio';
      default:
        return status;
    }
  }

  /**
   * Obtiene el texto del tipo de conexión
   */
  static getConnectionText(connected: boolean): string {
    return connected ? 'Conectada' : 'Desconectada';
  }

  /**
   * Obtiene el color del estado de conexión
   */
  static getConnectionColor(connected: boolean): string {
    return connected ? 'text-green-600' : 'text-red-600';
  }
}