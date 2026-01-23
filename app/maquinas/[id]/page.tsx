'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getMachineAction } from '@/lib/actions/machines';
import { Machine } from '@/lib/interfaces/machine.interface';
import { Monitor, ArrowLeft, Wifi, WifiOff, MapPin, Calendar, Activity, Edit, Package, Shield, RotateCcw } from 'lucide-react';
import { useMqttReboot } from '@/lib/hooks/useMqttReboot';

export default function MaquinaDetallePage() {
  const params = useParams();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { rebootMachine, isLoading: rebootLoading, hasCredentials } = useMqttReboot();

  const machineId = params.id as string;

  const handleBack = () => {
    // Forzar recarga completa de la página de máquinas
    window.location.href = '/maquinas';
  };

  const handleReboot = async () => {
    if (!machine) return;
    const confirmed = window.confirm(`¿Reiniciar la máquina "${machine.name}"?`);
    if (!confirmed) return;

    try {
      await rebootMachine(machine.id);
    } catch (rebootError) {
      console.error('Error al reiniciar la máquina:', rebootError);
    }
  };

  useEffect(() => {
    async function loadMachine() {
      try {
        setLoading(true);
        const result = await getMachineAction(machineId, { include: 'mqttUser' });
        
        if (result.success && result.machine) {
          setMachine(result.machine);
        } else {
          setError(result.error || 'Máquina no encontrada');
        }
      } catch (error) {
        console.error('Error al cargar máquina:', error);
      } finally {
        setLoading(false);
      }
    }

    if (machineId) {
      loadMachine();
    }
  }, [machineId]);

  const getStatusColor = (status: string) => {
    return status?.toLowerCase() === 'online'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusLabel = (status: string) => {
    return status?.toLowerCase() === 'online' ? 'En línea' : 'Fuera de línea';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles de la máquina...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Monitor className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquina</h3>
            <p className="text-muted mb-4">{error}</p>
            <button 
              onClick={handleBack}
              className="btn-primary"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-600 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Detalles de la Máquina</h1>
                  <p className="text-muted">Información completa y gestión de la máquina</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.location.href = `/maquinas/${machine.id}/slots`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Gestionar Slots</span>
                </button>
                <button 
                  onClick={() => window.location.href = `/maquinas/${machine.id}/editar`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleReboot}
                  disabled={rebootLoading || !hasCredentials}
                  className={`btn-secondary flex items-center space-x-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <RotateCcw className={`h-4 w-4 ${rebootLoading ? 'animate-spin' : ''}`} />
                  <span>{rebootLoading ? 'Reiniciando...' : 'Reiniciar máquina'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{machine.name}</h2>
                    <p className="text-muted">ID: {machine.id}</p>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Machine Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Monitor className="h-5 w-5 mr-2 text-primary" />
                  Información de la Máquina
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Nombre</label>
                    <p className="text-dark">{machine.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Ubicación</label>
                    <p className="text-dark flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-600 mt-0.5" />
                      <span className="whitespace-pre-line">{machine.location}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Tipo</label>
                    <p className="text-dark">{machine.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">ID Empresa</label>
                    <p className="text-dark">{machine.enterprise_id}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Estado y Conexión
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(machine.status)}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        {getStatusLabel(machine.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      {machine?.mqtt_user?.connection_status ? (
                        <div className="flex items-center text-green-500">
                          <Wifi className="h-5 w-5 mr-2" />
                          <span>Conectado</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <WifiOff className="h-5 w-5 mr-2" />
                          <span>Desconectado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Fecha de Creación</label>
                  <p className="text-dark flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    {new Date(machine.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Última Actualización</label>
                  <p className="text-dark flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    {new Date(machine.updated_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>

            {/* MQTT Credentials */}
            {machine.mqtt_user && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Credenciales MQTT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Usuario</label>
                    <p className="text-dark">{machine.mqtt_user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Client ID</label>
                    <p className="text-dark">{machine.mqtt_user.client_id || 'No asignado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Superusuario</label>
                    <p className="text-dark">{machine.mqtt_user.is_superuser ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">ID Máquina</label>
                    <p className="text-dark">{machine.id}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Advanced MQTT Data Section */}
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-medium text-black mb-4">Datos MQTT Avanzados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Usuario MQTT</label>
                  <p className="text-black">{machine?.mqtt_user?.username}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Client ID</label>
                  <p className="text-black">{machine?.mqtt_user?.client_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Contraseña Original</label>
                  <p className="text-black">{machine?.mqtt_user?.original_password}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Superusuario</label>
                  <p className="text-black">{machine?.mqtt_user?.is_superuser ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
