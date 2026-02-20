'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getMachineAction } from '@/lib/actions/machines';
import { Machine } from '@/lib/interfaces/machine.interface';
import { Monitor, Save, X, CheckCircle } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/ui-custom';
import Link from 'next/link';

export default function EditarMaquinaPage() {
  const params = useParams();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'offline',
    location: '',
    type: '',
    enterprise_id: '',
  });

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
          });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (successMessage) setSuccessMessage(null);
    if (error) setError(null);

    setFormData(prev => ({ ...prev, [name]: value }));
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

      const response = await fetch(`/maquinas/${machineId}/update`, {
        method: 'POST',
        body: form
      });

      if (response.redirected) {
        const redirectUrl = new URL(response.url);
        const updated = redirectUrl.searchParams.get('updated');

        if (updated === '1') {
          setSuccessMessage('¡Máquina actualizada exitosamente!');
          setError(null);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          const errorMsg = redirectUrl.searchParams.get('error');
          setError(decodeURIComponent(errorMsg || 'Error al actualizar la máquina'));
          setSuccessMessage(null);
        }
      }
    } catch (error) {
      console.error('Error al actualizar máquina:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader icon={Monitor} title="Editar Máquina" backHref={`/maquinas/${machineId}`} variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos de la máquina...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !machine) {
    return (
      <AppShell>
        <PageHeader icon={Monitor} title="Editar Máquina" backHref={`/maquinas/${machineId}`} variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Monitor className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquina</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link href="/maquinas" className="btn-primary">
              Volver al detalle
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon={Monitor}
        title="Editar Máquina"
        subtitle="Modificar información de la máquina"
        backHref={`/maquinas/${machineId}`}
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
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
          <div className="card p-4 sm:p-6">
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

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link
                  href={`/maquinas/${machineId}`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </Link>
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
    </AppShell>
  );
}
