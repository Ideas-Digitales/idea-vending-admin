export const getStatusColor = (status: string) => {
  const normalized = status?.toLowerCase();
  return normalized === 'online'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
};

export const getStatusIcon = (status: string, connectionStatus: boolean) => {
  if (!connectionStatus) return 'WifiOff';
  
  return status.toLowerCase() === 'online' ? 'Wifi' : 'Monitor';
};

export const getStatusName = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'online') {
    return 'En línea';
  }
  return 'Fuera de línea';
};

export const calculateMachineStats = (machines: Array<{ status: string; connection_status?: boolean }>) => {
  return {
    total: machines.length,
    online: machines.filter(m => m.status.toLowerCase() === 'online').length,
    offline: machines.filter(m => m.status.toLowerCase() !== 'online').length,
    disconnected: machines.filter(m => !m.connection_status).length,
  };
};
