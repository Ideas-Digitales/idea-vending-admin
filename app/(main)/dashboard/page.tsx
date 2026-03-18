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
  LineChart,
  Building2,
  CreditCard,
  Package,
  UserPlus,
  MonitorPlay,
  QrCode,
  Rocket,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { useAuthProtection } from '@/lib/hooks/useAuthProtection';
import { useUser } from '@/lib/stores/authStore';
import { getDashboardStatsAction, type DashboardStats } from '@/lib/actions/dashboard';
import { TourRunner, type Step } from '@/components/help/TourRunner';
import { SetupGuideModal } from '@/components/help/SetupGuideModal';
import { useMetricsFilterStore } from '@/lib/stores/metricsFilterStore';
import {
  PeriodSelector, EnterpriseMetricsSelector,
  ResumenMetricsPanel, MaquinasMetricsPanel, ProductosMetricsPanel,
} from '@/components/metrics';

const ADMIN_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Estado del sistema',
      description: 'Resumen rápido: total de máquinas, cuántas están en línea, cuántas fuera y total de usuarios registrados. Haz clic en cualquier chip para ir directamente a esa sección filtrada.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Acciones rápidas',
      description: '<p>Accesos directos a las operaciones más frecuentes:</p><p>• <b>Crear</b> producto, máquina, usuario o empresa.</p><p>• <b>Escanear QR</b> — apunta con la cámara al código de cualquier máquina para ir a su detalle.</p><p>• <b>Alta de cliente</b> — guía paso a paso para registrar una nueva empresa.</p>',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="metrics-section"]',
    popover: {
      title: 'Métricas de ventas',
      description: '<p>Visualiza ventas, transacciones y tendencias en tres vistas:</p><p>• <b>Resumen</b> — KPIs globales y gráfico de área.</p><p>• <b>Máquinas</b> — ranking de máquinas por ingresos.</p><p>• <b>Productos</b> — productos más vendidos.</p><p>Filtra por empresa y período con los controles superiores.</p>',
      side: 'top',
    },
  },
];

const CUSTOMER_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Accesos directos',
      description: 'Desde aquí accedes a tus máquinas, historial de pagos, productos y al escáner QR para ir al detalle de cualquier máquina.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="metrics-section"]',
    popover: {
      title: 'Tus métricas',
      description: '<p>Análisis de tus ventas en tres vistas:</p><p>• <b>Resumen</b> — KPIs globales y gráfico de tendencias.</p><p>• <b>Máquinas</b> — rendimiento por máquina.</p><p>• <b>Productos</b> — productos más vendidos.</p><p>Cambia el período con el selector de la esquina superior derecha.</p>',
      side: 'top',
    },
  },
];

const QRScannerModal = dynamic(() => import('@/components/QRScannerModal'), { ssr: false });

// ── Stat chip compacto ─────────────────────────────────────────────────────────
function StatChip({
  title, value, icon: Icon, color, bgColor, href,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="card px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className={`p-2 rounded-lg ${bgColor} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted font-medium truncate">{title}</p>
          <p className="text-lg font-bold text-dark leading-tight">{value}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Action chip compacto ───────────────────────────────────────────────────────
function ActionChip({
  title, icon: Icon, color, bgColor, href, onClick,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls = `flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200
    hover:border-gray-300 hover:shadow-sm active:scale-95 transition-all duration-150 group`;

  const inner = (
    <>
      <div className={`p-1.5 rounded-lg ${bgColor} flex-shrink-0 group-hover:scale-110 transition-transform duration-150`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <span className="text-sm font-semibold text-dark whitespace-nowrap">{title}</span>
    </>
  );

  return href
    ? <Link href={href} className={cls}>{inner}</Link>
    : <button onClick={onClick} className={cls}>{inner}</button>;
}

function DashboardContent() {
  const user = useUser();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [metricsTab, setMetricsTab] = useState<'resumen' | 'maquinas' | 'productos'>('resumen');
  const { selectedEnterpriseId, selectedEnterpriseName, period, setPeriod } = useMetricsFilterStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getDashboardStatsAction(selectedEnterpriseId ?? undefined)
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.stats) {
          setDashboardStats(res.stats);
        } else {
          setError(res.error || 'Error al cargar estadísticas');
        }
      })
      .catch(() => { if (isMounted) setError('Error de conexión'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [selectedEnterpriseId]);

  const isAdmin    = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  const tourSteps = isAdmin ? ADMIN_TOUR_STEPS : CUSTOMER_TOUR_STEPS;

  const adminActions = [
    { title: 'Crear Producto', icon: Package,    color: 'text-green-600',  bgColor: 'bg-green-50',  href: '/productos/crear' },
    { title: 'Crear Máquina',  icon: MonitorPlay, color: 'text-blue-600',   bgColor: 'bg-blue-50',   href: '/maquinas/nueva'  },
    { title: 'Crear Usuario',  icon: UserPlus,    color: 'text-purple-600', bgColor: 'bg-purple-50', href: '/usuarios/crear'  },
    { title: 'Crear Empresa',  icon: Building2,   color: 'text-orange-600', bgColor: 'bg-orange-50', href: '/empresas/crear'  },
    { title: 'Escanear QR',    icon: QrCode,      color: 'text-teal-600',   bgColor: 'bg-teal-50',   onClick: () => setIsQRScannerOpen(true) },
    { title: 'Alta de cliente',icon: Rocket,      color: 'text-primary',    bgColor: 'bg-primary/8', onClick: () => setIsSetupGuideOpen(true) },
  ] as const;

  const customerActions = [
    { title: 'Mis Máquinas', icon: Monitor,    color: 'text-purple-600', bgColor: 'bg-purple-50', href: '/maquinas' },
    { title: 'Mis Pagos',    icon: CreditCard, color: 'text-green-600',  bgColor: 'bg-green-50',  href: '/pagos'    },
    { title: 'Mis Productos',icon: ShoppingCart,color: 'text-orange-600',bgColor: 'bg-orange-50', href: '/productos'},
    { title: 'Escanear QR',  icon: QrCode,     color: 'text-teal-600',   bgColor: 'bg-teal-50',   onClick: () => setIsQRScannerOpen(true) },
  ] as const;

  const quickActions = isAdmin ? adminActions : isCustomer ? customerActions : [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenido de vuelta, ${user?.name}`}
        variant="white"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && <EnterpriseMetricsSelector />}
            <TourRunner steps={tourSteps} theme="light" />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-dark">{user?.email}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-8">

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-red-800 font-medium text-sm">Error al cargar el dashboard: {error}</p>
            </div>
          </div>
        )}

        {/* ── Stats strip — solo admin ── */}
        {isAdmin && (
          <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card px-4 py-3 flex items-center gap-3 animate-pulse">
                    <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
                      <div className="h-5 w-5 rounded bg-gray-200" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-gray-100 rounded mb-1.5" />
                      <div className="h-5 w-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))
              : dashboardStats && (
                  <>
                    <StatChip
                      title="Total Máquinas"
                      value={dashboardStats.machines.total.toString()}
                      icon={Monitor}
                      color="text-blue-600"
                      bgColor="bg-blue-50"
                      href="/maquinas"
                    />
                    <StatChip
                      title="Máquinas en línea"
                      value={`${dashboardStats.machines.online} / ${dashboardStats.machines.total}`}
                      icon={Activity}
                      color="text-emerald-600"
                      bgColor="bg-emerald-50"
                      href="/maquinas?status=online"
                    />
                    <StatChip
                      title="Fuera de línea"
                      value={dashboardStats.machines.offline.toString()}
                      icon={AlertTriangle}
                      color="text-red-500"
                      bgColor="bg-red-50"
                      href="/maquinas?status=offline"
                    />
                    <StatChip
                      title="Total Usuarios"
                      value={dashboardStats.users.total.toString()}
                      icon={Users}
                      color="text-purple-600"
                      bgColor="bg-purple-50"
                      href="/usuarios"
                    />
                  </>
                )
            }
          </div>
        )}

        {/* ── Quick actions ── */}
        {quickActions.length > 0 && (
          <div data-tour="quick-actions">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Plus className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Acciones rápidas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <ActionChip key={action.title} {...action} />
              ))}
            </div>
          </div>
        )}

        {/* ── Métricas — sección hero ── */}
        <div data-tour="metrics-section" className="space-y-3">
          {/* Header: título + tabs + selectores en una sola barra */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/8 flex-shrink-0">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-dark leading-tight">Métricas de ventas</h2>
                <p className="text-xs text-muted">Análisis de ingresos y rendimiento</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PeriodSelector period={period} onChange={setPeriod} variant="light" />
            </div>
          </div>

          {/* Tabs + contenido */}
          <div className="card overflow-hidden">
            {/* Banner de contexto — visible solo cuando hay empresa seleccionada */}
            {selectedEnterpriseId !== null && (
              <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <p className="text-xs font-semibold text-primary truncate">
                  Mostrando datos de: {selectedEnterpriseName ?? `Empresa #${selectedEnterpriseId}`}
                </p>
              </div>
            )}

            {/* Tab bar pegada al card */}
            <div className="border-b border-gray-100 px-4 flex gap-0">
              {([
                { id: 'resumen',   label: 'Resumen'   },
                { id: 'maquinas',  label: 'Máquinas'  },
                { id: 'productos', label: 'Productos' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMetricsTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    metricsTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-dark hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="p-4 sm:p-5">
              {metricsTab === 'resumen'   && <ResumenMetricsPanel   enterpriseId={selectedEnterpriseId} period={period} />}
              {metricsTab === 'maquinas'  && <MaquinasMetricsPanel  enterpriseId={selectedEnterpriseId} period={period} />}
              {metricsTab === 'productos' && <ProductosMetricsPanel enterpriseId={selectedEnterpriseId} period={period} />}
            </div>
          </div>
        </div>
      </main>

      <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} />
      <SetupGuideModal isOpen={isSetupGuideOpen} onClose={() => setIsSetupGuideOpen(false)} />
    </>
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
