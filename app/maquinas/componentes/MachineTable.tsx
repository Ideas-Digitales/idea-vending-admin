'use client';

import { Monitor, MapPin, Eye, Edit, Trash2 } from 'lucide-react';
import { type Machine } from '@/lib/interfaces/machine.interface';
import { getStatusColor, getStatusName } from '../utils/machineHelpers';
import { useRouter } from 'next/navigation';

const getMachineTypeLabel = (type?: string | null) => {
  if (!type) return '-';
  const normalized = type.toUpperCase();
  if (normalized === 'PULSES') return 'PULSOS';
  return type;
};

interface MachineTableProps {
  machines: Machine[];
  loading?: boolean;
}

export default function MachineTable({ machines, loading }: MachineTableProps) {
  const router = useRouter();

  const handleViewMachine = (machineId: number | string) => {
    router.push(`/maquinas/${machineId}`);
  };

  const handleEditMachine = (machineId: number | string) => {
    router.push(`/maquinas/${machineId}/update`);
  };

  const handleDeleteMachine = (machineId: number | string) => {
    router.push(`/maquinas/${machineId}/delete`);
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
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Creada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actualizada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {machines.map((machine) => (
            <tr key={machine.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                {machine.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-dark">{machine.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(machine.status)}`}>
                  <span
                    className={`h-2 w-2 rounded-full mr-2 ${machine.status?.toLowerCase() === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-hidden
                  />
                  {getStatusName(machine.status)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-dark whitespace-pre-line">{machine.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                {new Date(machine.created_at).toLocaleString('es-ES')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                {new Date(machine.updated_at).toLocaleString('es-ES')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {getMachineTypeLabel(machine.type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => handleViewMachine(machine.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEditMachine(machine.id)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Editar máquina"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMachine(machine.id)}
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
