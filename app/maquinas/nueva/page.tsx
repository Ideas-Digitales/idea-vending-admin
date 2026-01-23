'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import { Monitor, Loader2 } from "lucide-react";
import { createMachineAction } from "@/lib/actions/machines";
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import { notify } from '@/lib/adapters/notification.adapter';
import { type CreateMachineFormData } from "@/lib/schemas/machine.schema";
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

export default function NuevaMaquinaPage() {
  const router = useRouter();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'MDB' as CreateMachineFormData['type'],
    enterprise_id: 0,
  });

  useEffect(() => {
    async function loadEnterprises() {
      try {
        const response = await getEnterprisesAction();
        if (response.success && response.enterprises) {
          setEnterprises(response.enterprises);
        }
      } catch (err) {
        console.error('Error al cargar empresas:', err);
      } finally {
        setIsLoadingEnterprises(false);
      }
    }
    loadEnterprises();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!formData.name.trim()) {
      notify.error('El nombre es requerido');
      return;
    }
    if (!formData.location.trim()) {
      notify.error('La ubicación es requerida');
      return;
    }
    if (!formData.enterprise_id || formData.enterprise_id <= 0) {
      notify.error('Debe seleccionar una empresa');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMachineAction({
        ...formData,
        client_id: null,
      });
      
      if (result.success) {
        notify.success('Máquina creada exitosamente');
        window.location.href = '/maquinas';
      } else {
        notify.error(result.error || 'Error al crear máquina');
      }
    } catch (err) {
      console.error('Error al crear máquina:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'enterprise_id' ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Nueva Máquina</h1>
                <p className="text-gray-600">Crea una máquina usando datos reales</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Nombre</label>
                <input 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black" 
                  placeholder="Nombre de la máquina" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Ubicación</label>
                <textarea 
                  name="location" 
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black" 
                  rows={3} 
                  placeholder="Dirección o descripción" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Tipo</label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black select-custom" 
                  required
                >
                  <option value="PULSES">PULSES</option>
                  <option value="MDB">MDB</option>
                  <option value="MDB-DEX">MDB-DEX</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Empresa</label>
                {isLoadingEnterprises ? (
                  <div className="flex items-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cargando empresas...
                  </div>
                ) : (
                  <select
                    name="enterprise_id"
                    value={formData.enterprise_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black select-custom"
                    required
                  >
                    <option value="0">Selecciona una empresa</option>
                    {enterprises.map((enterprise) => (
                      <option key={enterprise.id} value={enterprise.id}>
                        {enterprise.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/maquinas')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    'Crear Máquina'
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
