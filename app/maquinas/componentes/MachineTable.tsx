'use client';

import { Monitor, MapPin, Eye, Edit, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { type Maquina } from '../serveractions/machines';
import { getStatusColor, getStatusName } from '../utils/machineHelpers';

interface MachineTableProps {
  machines: Maquina[];
  loading?: boolean;
}

export default function MachineTable({ machines, loading }: MachineTableProps) {
  const getStatusIcon = (status: string, connectionStatus: boolean) => {
    if (!connectionStatus) return <WifiOff className="h-4 w-4" />;
    
    switch (status.toLowerCase()) {
      case 'active': return <Wifi className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  if (machines.length === 0 && !loading) {
    return (
      <div className="p-8 text-center">
        <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark mb-2">No se encontraron máquinas</h3>
        <p className="text-muted">
          No hay máquinas registradas en el sistema o intenta ajustar los filtros de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Máquina
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Ubicación
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Tipo
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Estado
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Conexión
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Última Actualización
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">API</span>
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {machines.map((maquina) => (
            <tr key={maquina.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-dark">{maquina.name}</div>
                    <div className="text-sm text-muted">ID: {maquina.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-dark">{maquina.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {maquina.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(maquina.status)}`}>
                  {getStatusName(maquina.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(maquina.status, maquina.connection_status)}
                  <span className={`ml-2 text-sm ${maquina.connection_status ? 'text-green-600' : 'text-red-600'}`}>
                    {maquina.connection_status ? 'Conectada' : 'Desconectada'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                {new Date(maquina.updated_at).toLocaleString('es-ES')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Editar máquina"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Eliminar máquina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
