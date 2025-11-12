'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getMachineAction } from '@/lib/actions/machines';
import { Machine } from '@/lib/interfaces/machine.interface';
import { Monitor, ArrowLeft, Save, X, CheckCircle } from 'lucide-react';

export default function EditarMaquinaPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    location: '',
    type: '',
    enterprise_id: '',
    is_enabled: false
  });

  const handleBack = () => {
    window.location.href = `/maquinas/${machineId}`;
  };

  // Cargar máquina al montar el componente
  useEffect(() => {
    async function loadMachine() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMachineAction(machineId);
        
        if (result.success && result.machine) {
          setMachine(result.machine);
          setFormData({
            name: result.machine.name,
            status: result.machine.status,
            location: result.machine.location,
            type: result.machine.type,
            enterprise_id: result.machine.enterprise_id.toString(),
            is_enabled: result.machine.is_enabled
          });
        } else {
          setError(result.error || 'Máquina no encontrada');
        }
      } catch (err) {
        setError('Error al cargar la máquina');
      } finally {
        setLoading(false);
      }
    }

    if (machineId) {
      loadMachine();
    }
  }, [machineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Limpiar mensajes cuando el usuario empiece a editar
    if (successMessage) setSuccessMessage(null);
    if (error) setError(null);
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const form = new FormData();
      form.append('name', formData.name);
      form.append('status', formData.status);
      form.append('location', formData.location);
      form.append('type', formData.type);
      form.append('enterprise_id', formData.enterprise_id);
      if (formData.is_enabled) {
        form.append('is_enabled', 'on');
      }

      const response = await fetch(`/maquinas/${machineId}/update`, {
        method: 'POST',
        body: form
      });

      // La respuesta será una redirección, así que verificamos si fue exitosa
      if (response.redirected) {
        // Extraer parámetros de la URL de redirección
        const redirectUrl = new URL(response.url);
        const updated = redirectUrl.searchParams.get('updated');
        
        if (updated === '1') {
          // Éxito - mostrar mensaje y mantener en la vista de edición
          setSuccessMessage('¡Máquina actualizada exitosamente!');
          setError(null);
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          // Error - mostrar mensaje
          const errorMsg = redirectUrl.searchParams.get('error');
          setError(decodeURIComponent(errorMsg || 'Error al actualizar la máquina'));
          setSuccessMessage(null);
        }
      }
    } catch (err) {
      setError('Error al actualizar la máquina');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos de la máquina...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !machine) {
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
            <button onClick={handleBack} className="btn-primary">
              Volver al detalle
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
                  <h1 className="text-2xl font-bold text-dark">Editar Máquina</h1>
                  <p className="text-muted">Modificar información de la máquina</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Éxito</h3>
                    <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  </div>
                  <button 
                    onClick={() => setSuccessMessage(null)}
                    className="ml-auto text-green-500 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mr-4">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark">
                    {machine?.name || 'Máquina'}
                  </h2>
                  <p className="text-muted">ID: {machineId}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Nombre de la Máquina
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                      placeholder="Ingrese el nombre de la máquina"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Estado
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="select-custom w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="Active">Activa</option>
                      <option value="Inactive">Inactiva</option>
                      <option value="Maintenance">Mantenimiento</option>
                      <option value="OutOfService">Fuera de Servicio</option>
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Tipo de Máquina
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="select-custom w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="PULSES">PULSES</option>
                      <option value="MDB">MDB</option>
                      <option value="MDB-DEX">MDB-DEX</option>
                    </select>
                  </div>

                  {/* ID Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      ID Empresa
                    </label>
                    <input
                      type="number"
                      name="enterprise_id"
                      value={formData.enterprise_id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="ID de la empresa"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      El ID de empresa no puede modificarse después de crear la máquina
                    </p>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Ubicación
                  </label>
                  <textarea
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                    placeholder="Ingrese la ubicación de la máquina"
                  />
                </div>

                {/* Habilitada */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={formData.is_enabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-black">
                    Máquina habilitada
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex items-center space-x-2"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
