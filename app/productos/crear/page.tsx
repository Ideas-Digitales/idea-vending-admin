'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Save, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import { createProductAction } from '@/lib/actions/products';
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import { notify } from '@/lib/adapters/notification.adapter';
import { useMqttProduct } from '@/lib/hooks/useMqttProduct';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import type { CreateProductFormData } from '@/lib/schemas/product.schema';

export default function CreateProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateProductFormData>({
    name: '',
    enterprise_id: 0,
  });
  
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { publishProductOperation, isPublishing } = useMqttProduct();

  // Load enterprises on component mount
  useEffect(() => {
    const loadEnterprises = async () => {
      try {
        const response = await getEnterprisesAction({ limit: 100 });
        if (response.success && response.enterprises) {
          setEnterprises(response.enterprises);
        } else {
          notify.error('Error al cargar empresas: ' + (response.error || 'Error desconocido'));
        }
      } catch (error) {
        notify.error('Error al cargar empresas');
      } finally {
        setIsLoadingEnterprises(false);
      }
    };

    loadEnterprises();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'enterprise_id' ? Number(value) : (type === 'number' ? (value === '' ? 0 : Number(value)) : value)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await createProductAction(formData);
      
      if (response.success && response.product) {
        try {
          await publishProductOperation('create', response.product);
        } catch (mqttError) {
          console.error('Error sincronizando producto via MQTT:', mqttError);
          notify.error('Producto creado, pero falló la sincronización MQTT. Intenta nuevamente.');
          return;
        }

        notify.success('Producto creado y sincronizado exitosamente');
        // Limpiar caché completamente y redirigir
        localStorage.removeItem('product-store');
        // Usar window.location para forzar recarga completa de la página
        window.location.href = '/productos';
      } else {
        notify.error('Error al crear producto: ' + (response.error || 'Error desconocido'));
        
        // Parse validation errors if they exist
        if (response.error?.includes('Datos inválidos:')) {
          const errorMessage = response.error.replace('Datos inválidos: ', '');
          const fieldErrors: Record<string, string> = {};
          
          errorMessage.split(', ').forEach(error => {
            const [field, message] = error.split(': ');
            if (field && message) {
              fieldErrors[field] = message;
            }
          });
          
          setErrors(fieldErrors);
        }
      }
    } catch {
      console.error('Error al crear producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/productos');
  };

  return (
    <PageWrapper requiredPermissions={['products.create']} permissionMatch="all">
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
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Crear Producto</h1>
                  <p className="text-muted">Agregar un nuevo producto al inventario</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Información del Producto
              </h3>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Coca Cola 350ml"
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                {/* Enterprise */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Empresa *
                  </label>
                  {isLoadingEnterprises ? (
                    <div className="input-field flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cargando empresas...
                    </div>
                  ) : (
                    <select
                      name="enterprise_id"
                      value={formData.enterprise_id}
                      onChange={handleInputChange}
                      className={`input-field ${errors.enterprise_id ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value={0}>Seleccionar empresa</option>
                      {enterprises.map((enterprise) => (
                        <option key={enterprise.id} value={enterprise.id}>
                          {enterprise.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.enterprise_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.enterprise_id}</p>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading || isLoadingEnterprises || isPublishing}
                    className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>
                      {isLoading
                        ? 'Creando...'
                        : isPublishing
                          ? 'Sincronizando...'
                          : 'Crear Producto'}
                    </span>
                  </button>
                  
                  <Link
                    href="/productos"
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Cancelar</span>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </PageWrapper>
  );
}
