'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import {
  Users,
  ShoppingCart,
  Monitor,
  AlertTriangle,
  Activity,
  Zap,
  LineChart,
  Building2,
  CreditCard,
  Package,
  UserPlus,
  MonitorPlay,
  QrCode,
  Rocket,
} from 'lucide-react';
import { AppShell, PageHeader } from '@/components/ui-custom';
import { useAuthProtection } from '@/lib/hooks/useAuthProtection';
import { useUser } from '@/lib/stores/authStore';
import { getDashboardStatsAction, type DashboardStats } from '@/lib/actions/dashboard';
import { TourRunner, type Step } from '@/components/help/TourRunner';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { SetupGuideModal } from '@/components/help/SetupGuideModal';

const ADMIN_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Resumen del sistema',
      description: 'Vista en tiempo real de tus máquinas y usuarios. Haz clic en cualquier tarjeta para ir directamente a esa sección.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Acciones rápidas',
      description: 'Accesos directos a las operaciones más frecuentes. El escáner QR te lleva al detalle de cualquier máquina apuntando con la cámara.',
      side: 'top',
    },
  },
];

const CUSTOMER_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Acciones rápidas',
      description: 'Desde aquí puedes acceder a tus métricas de ventas, estado de máquinas, historial de pagos y productos. El escáner QR te lleva al detalle de cualquier máquina.',
      side: 'top',
    },
  },
];

const QRScannerModal = dynamic(() => import('@/components/QRScannerModal'), { ssr: false });

function DashboardContent() {
  const user = useUser();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;

    const loadDashboardData = async () => {
      if (hasLoaded || !isMounted) return;
      hasLoaded = true;
      try {
        setLoading(true);
        const statsResponse = await getDashboardStatsAction();
        if (!isMounted) return;
        if (statsResponse.success && statsResponse.stats) {
          setDashboardStats(statsResponse.stats);
        } else {
          setError(statsResponse.error || 'Error al cargar estadísticas');
        }
      } catch {
        if (!isMounted) return;
        setError('Error de conexión');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(loadDashboardData, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const stats = dashboardStats
    ? [
        {
          title: 'Total Máquinas',
          value: dashboardStats.machines.total.toString(),
          icon: Monitor,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          href: '/maquinas',
        },
        {
          title: 'Máquinas en línea',
          value: `${dashboardStats.machines.online}/${dashboardStats.machines.total}`,
          icon: Activity,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          href: '/maquinas?status=online',
        },
        {
          title: 'Máquinas fuera de línea',
          value: dashboardStats.machines.offline.toString(),
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          href: '/maquinas?status=offline',
        },
        {
          title: 'Total Usuarios',
          value: dashboardStats.users.total.toString(),
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          href: '/usuarios',
        },
      ]
    : [];

  type QuickAction = {
    title: string;
    description: string;
    icon: typeof Package;
    color: string;
    bgColor: string;
  } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

  const qrScanAction: QuickAction = {
    title: 'Escanear QR',
    description: 'Ir al detalle de máquina',
    onClick: () => setIsQRScannerOpen(true),
    icon: QrCode,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 group-hover:bg-teal-100',
  };

  const adminQuickActions: QuickAction[] = [
    {
      title: 'Crear Producto',
      description: 'Registrar nuevo producto',
      href: '/productos/crear',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50 group-hover:bg-green-100',
    },
    {
      title: 'Crear Máquina',
      description: 'Agregar máquina al sistema',
      href: '/maquinas/nueva',
      icon: MonitorPlay,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 group-hover:bg-blue-100',
    },
    {
      title: 'Crear Usuario',
      description: 'Registrar nuevo usuario',
      href: '/usuarios/crear',
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 group-hover:bg-purple-100',
    },
    {
      title: 'Crear Empresa',
      description: 'Agregar empresa al sistema',
      href: '/empresas/crear',
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 group-hover:bg-orange-100',
    },
    qrScanAction,
    {
      title: 'Alta de cliente',
      description: 'Guía paso a paso',
      onClick: () => setIsSetupGuideOpen(true),
      icon: Rocket,
      color: 'text-primary',
      bgColor: 'bg-primary/8 group-hover:bg-primary/15',
    },
  ];

  const customerQuickActions: QuickAction[] = [
    {
      title: 'Ver Métricas',
      description: 'Ventas y rendimiento',
      href: '/metricas',
      icon: LineChart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 group-hover:bg-blue-100',
    },
    {
      title: 'Mis Máquinas',
      description: 'Estado y monitoreo',
      href: '/maquinas',
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 group-hover:bg-purple-100',
    },
    {
      title: 'Mis Pagos',
      description: 'Historial de transacciones',
      href: '/pagos',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50 group-hover:bg-green-100',
    },
    {
      title: 'Mis Productos',
      description: 'Inventario disponible',
      href: '/productos',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 group-hover:bg-orange-100',
    },
    qrScanAction,
  ];

  const quickActions = user?.role === 'admin'
    ? adminQuickActions
    : user?.role === 'customer'
      ? customerQuickActions
      : [];

  const tourSteps = user?.role === 'admin' ? ADMIN_TOUR_STEPS : CUSTOMER_TOUR_STEPS;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenido de vuelta, ${user?.name}`}
        variant="white"
        actions={
          <div className="flex items-center gap-2">
            <TourRunner steps={tourSteps} theme="light" />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-dark">{user?.email}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted">Cargando estadísticas...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800 font-medium">Error al cargar el dashboard</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div data-tour="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <Link key={index} href={stat.href} className="group">
                <div
                  className="card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-muted mb-2 group-hover:text-gray-600 transition-colors flex items-center gap-1">
                        {stat.title}
                        {stat.title === 'Máquinas en línea' && (
                          <HelpTooltip text="La barra muestra el porcentaje de máquinas activas sobre el total. Una máquina en línea está comunicada con el servidor y puede procesar pagos." side="top" />
                        )}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-dark mb-1 group-hover:scale-105 transition-transform">
                        {stat.value}
                      </p>
                      {stat.title.includes('en línea') && dashboardStats && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(dashboardStats.machines.online / dashboardStats.machines.total) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-xl ${stat.bgColor} flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className={`h-7 w-7 ${stat.color} group-hover:animate-pulse`} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {quickActions.length > 0 && (
          <div data-tour="quick-actions" className="mb-8">
            <h3 className="text-lg font-bold text-dark mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-orange-500" />
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const content = (
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-xl ${action.bgColor} transition-colors mb-3 w-14 h-14 flex items-center justify-center`}>
                      <action.icon className={`h-7 w-7 ${action.color}`} />
                    </div>
                    <h4 className="font-semibold text-dark text-sm mb-0.5">{action.title}</h4>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                );
                return action.href ? (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="card p-5 hover:shadow-lg transition-all duration-200 group hover:-translate-y-1"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={action.title}
                    onClick={action.onClick}
                    className="card p-5 hover:shadow-lg transition-all duration-200 group hover:-translate-y-1 text-left w-full"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} />
      <SetupGuideModal isOpen={isSetupGuideOpen} onClose={() => setIsSetupGuideOpen(false)} />
    </AppShell>
  );
}

export default function DashboardPage() {
  const { shouldShowContent, isLoading } = useAuthProtection();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!shouldShowContent) return null;

  return <DashboardContent />;
}
