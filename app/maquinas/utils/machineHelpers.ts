export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-red-100 text-red-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'outofservice': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIcon = (status: string, connectionStatus: boolean) => {
  if (!connectionStatus) return 'WifiOff';
  
  switch (status.toLowerCase()) {
    case 'active': return 'Wifi';
    case 'maintenance': return 'AlertTriangle';
    default: return 'Monitor';
  }
};

export const getStatusName = (status: string) => {
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
};

export const calculateMachineStats = (machines: Array<{ status: string; connection_status?: boolean }>) => {
  return {
    total: machines.length,
    active: machines.filter(m => m.status.toLowerCase() === 'active').length,
    maintenance: machines.filter(m => m.status.toLowerCase() === 'maintenance').length,
    offline: machines.filter(m => !m.connection_status).length,
  };
};
