'use client';

import { ArrowLeft, Package, Wrench, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default function CreateProductPage() {
  const handleBack = () => {
    window.location.href = '/productos';
  };

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
            
            {/* Development Notice */}
            <div className="card p-8 text-center mb-6 border-2 border-dashed border-orange-200 bg-orange-50">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-orange-800 mb-3">
                Funcionalidad en Desarrollo
              </h2>
              
              <p className="text-orange-700 mb-4 leading-relaxed">
                La funcionalidad para crear productos está actualmente en desarrollo. 
                Los endpoints de la API aún no están disponibles.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-6 border border-orange-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-semibold text-orange-800 mb-2">Estado del desarrollo:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Vista de interfaz: ✅ Completada</li>
                      <li>• Validación de formularios: ⏳ Pendiente</li>
                      <li>• Endpoints de API: ⏳ Pendiente</li>
                      <li>• Integración completa: ⏳ Pendiente</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/productos"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a Productos</span>
                </Link>
                
                <button
                  disabled
                  className="btn-secondary opacity-50 cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Crear Producto (Próximamente)</span>
                </button>
              </div>
            </div>

            {/* Preview Form (Disabled) */}
            <div className="card p-6 opacity-60">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Vista Previa del Formulario
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="Ej: Coca Cola 350ml"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    >
                      <option>Seleccionar categoría</option>
                      <option>Bebidas</option>
                      <option>Snacks</option>
                      <option>Dulces</option>
                      <option>Saludable</option>
                      <option>Lácteos</option>
                      <option>Panadería</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    disabled
                    rows={3}
                    placeholder="Descripción del producto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      disabled
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Inicial *
                    </label>
                    <input
                      type="number"
                      disabled
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="123456789012"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    disabled
                    id="is_active"
                    className="rounded border-gray-300 cursor-not-allowed"
                    defaultChecked
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Producto activo
                  </label>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
