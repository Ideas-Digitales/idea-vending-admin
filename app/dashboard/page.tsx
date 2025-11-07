'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Monitor,
  AlertTriangle,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Clock
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
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-400" />
                <div className="text-right">
                  <p className="text-sm font-medium text-dark">{user?.email}</p>
                  <p className="text-xs text-muted">{user?.role}</p>
                </div>
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

          {/* Visual Charts Section */}
          {!loading && !error && dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Machine Status Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-dark mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Estado de Máquinas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Activas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">{dashboardStats.machines.active}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.machines.active / dashboardStats.machines.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Inactivas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">{dashboardStats.machines.inactive}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.machines.inactive / dashboardStats.machines.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Mantenimiento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-yellow-600">{dashboardStats.machines.maintenance}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.machines.maintenance / dashboardStats.machines.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Fuera de Servicio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-600">{dashboardStats.machines.outOfService}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.machines.outOfService / dashboardStats.machines.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Distribution Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-dark mb-6 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Distribución de Usuarios
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Administradores</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-purple-600">{dashboardStats.users.admins}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.users.admins / dashboardStats.users.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Operadores</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">{dashboardStats.users.operators}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.users.operators / dashboardStats.users.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-dark">Activos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">{dashboardStats.users.active}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(dashboardStats.users.active / dashboardStats.users.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

          {/* System Status Summary */}
          {!loading && !error && dashboardStats && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-dark flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-500" />
                  Estado del Sistema
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Sistema Operativo</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-1">
                    {Math.round((dashboardStats.machines.active / dashboardStats.machines.total) * 100)}%
                  </p>
                  <p className="text-sm text-muted">Disponibilidad de Máquinas</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {Math.round((dashboardStats.users.active / dashboardStats.users.total) * 100)}%
                  </p>
                  <p className="text-sm text-muted">Usuarios Activos</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600 mb-1">
                    {dashboardStats.machines.inactive + dashboardStats.machines.maintenance + dashboardStats.machines.outOfService}
                  </p>
                  <p className="text-sm text-muted">Máquinas No Operativas</p>
                </div>
              </div>
            </div>
          )}
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
