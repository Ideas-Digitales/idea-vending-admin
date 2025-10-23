'use client';

import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function ReportesContent() {
  const user = useUser();

  const ventasSemanales = [
    { dia: 'Lun', ventas: 45, ingresos: 112500 },
    { dia: 'Mar', ventas: 52, ingresos: 130000 },
    { dia: 'Mié', ventas: 38, ingresos: 95000 },
    { dia: 'Jue', ventas: 61, ingresos: 152500 },
    { dia: 'Vie', ventas: 73, ingresos: 182500 },
    { dia: 'Sáb', ventas: 29, ingresos: 72500 },
    { dia: 'Dom', ventas: 18, ingresos: 45000 },
  ];

  const productosTop = [
    { nombre: 'Coca Cola 350ml', ventas: 156, porcentaje: 28 },
    { nombre: 'Papas Lays Original', ventas: 134, porcentaje: 24 },
    { nombre: 'Agua Mineral 500ml', ventas: 98, porcentaje: 18 },
    { nombre: 'Chocolate Snickers', ventas: 87, porcentaje: 16 },
    { nombre: 'Galletas Oreo', ventas: 78, porcentaje: 14 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Reportes y Analytics</h1>
                  <p className="text-muted">Análisis de ventas y rendimiento</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted" />
                <span className="text-sm text-muted">Última semana</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
        {/* User Info */}
        <div className="mb-6 card p-4">
          <p className="text-sm text-muted">
            Conectado como: <span className="font-semibold text-dark">{user?.name}</span> 
            ({user?.role}) - Permisos: {user?.permissions.join(', ')}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted mb-1">Ventas Totales</p>
                <p className="text-2xl font-bold text-dark">316</p>
                <p className="text-sm text-green-600 font-medium">+12% vs semana anterior</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted mb-1">Ingresos</p>
                <p className="text-2xl font-bold text-dark">$790K</p>
                <p className="text-sm text-green-600 font-medium">+8% vs semana anterior</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted mb-1">Ticket Promedio</p>
                <p className="text-2xl font-bold text-dark">$2,500</p>
                <p className="text-sm text-red-600 font-medium">-3% vs semana anterior</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted mb-1">Máquinas Activas</p>
                <p className="text-2xl font-bold text-dark">3/4</p>
                <p className="text-sm text-yellow-600 font-medium">1 máquina offline</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ventas por Día */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-dark mb-6">Ventas por Día</h3>
            <div className="space-y-4">
              {ventasSemanales.map((dia, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm font-medium text-muted">{dia.dia}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 bg-gray-200 rounded-full flex-1 max-w-32">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${(dia.ventas / 73) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-dark w-8">{dia.ventas}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-dark">${dia.ingresos.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Productos */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-dark mb-6">Productos Más Vendidos</h3>
            <div className="space-y-4">
              {productosTop.map((producto, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-dark">{producto.nombre}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="h-2 bg-gray-200 rounded-full flex-1 max-w-24">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${producto.porcentaje * 3.57}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted">{producto.porcentaje}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-dark">{producto.ventas}</p>
                    <p className="text-xs text-muted">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen Semanal */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-bold text-dark mb-4">Resumen de la Semana</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-primary mb-1">316</p>
              <p className="text-sm text-muted">Total Transacciones</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600 mb-1">$790,000</p>
              <p className="text-sm text-muted">Ingresos Totales</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 mb-1">Viernes</p>
              <p className="text-sm text-muted">Mejor Día de Ventas</p>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  return (
    <ProtectedRoute requiredPermissions={['read', 'view_reports']}>
      <ReportesContent />
    </ProtectedRoute>
  );
}
