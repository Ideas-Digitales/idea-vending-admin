'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart,
  Settings,
  Monitor,
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';
import { getDashboardStatsAction, type DashboardStats } from '@/lib/actions/dashboard';

function DashboardContent() {
  const user = useUser();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;

    const loadDashboardData = async () => {
      // PREVENIR MÚLTIPLES CARGAS
      if (hasLoaded || !isMounted) {
        console.log('🔄 Dashboard: Evitando carga múltiple', { hasLoaded, isMounted });
        return;
      }

      hasLoaded = true;
      console.log('🔄 Dashboard: Iniciando carga única de estadísticas...');

      try {
        setLoading(true);
        const statsResponse = await getDashboardStatsAction();

        if (!isMounted) return; // Componente desmontado

        if (statsResponse.success && statsResponse.stats) {
          setDashboardStats(statsResponse.stats);
          console.log('✅ Dashboard: Estadísticas cargadas exitosamente');
        } else {
          setError(statsResponse.error || 'Error al cargar estadísticas');
          console.error('❌ Dashboard: Error al cargar estadísticas:', statsResponse.error);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Error de conexión');
        console.error('❌ Dashboard: Error de conexión:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Delay para evitar llamadas inmediatas
    const timer = setTimeout(loadDashboardData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Solo ejecutar una vez

  const stats = dashboardStats ? [
    {
      title: 'Total Máquinas',
      value: dashboardStats.machines.total.toString(),
      icon: Monitor,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Máquinas Activas',
      value: `${dashboardStats.machines.active}/${dashboardStats.machines.total}`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Máquinas Inactivas',
      value: dashboardStats.machines.inactive.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total Usuarios',
      value: dashboardStats.users.total.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ] : [];

  const quickActions = [
    { title: 'Gestionar Usuarios', href: '/usuarios', icon: Users, color: 'text-blue-600', permission: 'manage_users' },
    { title: 'Monitorear Máquinas', href: '/maquinas', icon: Monitor, color: 'text-purple-600', permission: 'manage_machines' },
    { title: 'Ver Productos', href: '/productos', icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Gestionar Empresas', href: '/empresas', icon: Settings, color: 'text-orange-600', permission: 'manage_enterprises' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
                <p className="text-muted">Bienvenido de vuelta, {user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-dark">{user?.email}</p>
                <p className="text-xs text-muted">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted">Cargando estadísticas...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">Error al cargar el dashboard</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-muted mb-2 group-hover:text-gray-600 transition-colors">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-dark mb-1 group-hover:scale-105 transition-transform">
                        {stat.value}
                      </p>
                      {/* Progress bar visual */}
                      {stat.title.includes('Activas') && dashboardStats && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${(dashboardStats.machines.active / dashboardStats.machines.total) * 100}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl ${stat.bgColor} flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`h-7 w-7 ${stat.color} group-hover:animate-pulse`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-dark mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-orange-500" />
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions
                .filter(action => !action.permission || user?.permissions.includes(action.permission))
                .map((action, index) => (
                <a
                  key={action.title}
                  href={action.href}
                  className="card p-6 hover:shadow-lg transition-all duration-200 group hover:scale-105"
                >
                  <div className="text-center">
                    <div className={`p-4 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors mx-auto mb-3 w-16 h-16 flex items-center justify-center`}>
                      <action.icon className={`h-8 w-8 ${action.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <h4 className="font-semibold text-dark mb-1">{action.title}</h4>
                    <p className="text-xs text-muted">Acceso rápido</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
