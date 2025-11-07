'use client';

import { BarChart3, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function ReportesContent() {
  const user = useUser();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Reportes y Analytics</h1>
                <p className="text-muted">Análisis de ventas y rendimiento</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-dark mb-4">Próximamente</h2>
              <p className="text-muted mb-6">
                Los reportes y analytics están en desarrollo. Pronto podrás ver estadísticas detalladas de ventas, 
                rendimiento de máquinas y análisis de productos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white rounded-lg border">
                  <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-dark">Análisis de Ventas</p>
                  <p className="text-muted text-xs">Tendencias y patrones</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-dark">Ingresos</p>
                  <p className="text-muted text-xs">Reportes financieros</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium text-dark">Rendimiento</p>
                  <p className="text-muted text-xs">Métricas de máquinas</p>
                </div>
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
