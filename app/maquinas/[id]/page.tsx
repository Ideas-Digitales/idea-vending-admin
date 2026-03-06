'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMachineAction } from '@/lib/actions/machines';
import { aggregatePaymentsAction } from '@/lib/actions/payments';
import { Machine } from '@/lib/interfaces/machine.interface';
import {
  Monitor, Wifi, WifiOff, MapPin, Calendar, Activity, Edit, Package,
  Shield, RotateCcw, QrCode, TrendingUp, TrendingDown, BarChart2,
  ChevronDown, Eye, EyeOff, Copy, Check, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useMqttReboot } from '@/lib/hooks/useMqttReboot';
import { AppShell, PageHeader } from '@/components/ui-custom';
import Link from 'next/link';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { TourRunner, type Step } from '@/components/help/TourRunner';

const MACHINE_DETAIL_TOUR: Step[] = [
  {
    element: '[data-tour="machine-actions"]',
    popover: {
      title: 'Acciones de la máquina',
      description: '<p><b>📲 Generar QR</b> — descarga el código QR para imprimir en la máquina.</p><p><b>📦 Gestionar Slots</b> — configura los compartimentos y los productos cargados.</p><p><b>✏️ Editar</b> — modifica nombre, ubicación o tipo de protocolo.</p><p><b>💳 Ver pagos</b> — abre el historial de pagos de esta máquina con el filtro aplicado.</p><p><b>🔄 Reiniciar</b> — envía un comando de reinicio por MQTT (requiere conexión activa).</p>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="machine-metrics"]',
    popover: {
      title: 'Métricas de ventas',
      description: 'Ingresos, número de transacciones y ticket promedio de esta máquina. Cambia el período con los botones Últimos 7 días / Este mes / Este año para ver distintos rangos. El gráfico muestra la evolución temporal.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="machine-info"]',
    popover: {
      title: 'Información y estado',
      description: '<p><b>Información</b>: nombre, ubicación física, tipo de protocolo y empresa propietaria.</p><p><b>Estado y Conexión</b>: <i>En línea</i> indica que la máquina procesa pagos. La conexión MQTT es el canal en tiempo real para comandos como el reinicio.</p>',
      side: 'top',
    },
  },
  {
    element: '[data-tour="machine-mqtt"]',
    popover: {
      title: 'Credenciales MQTT',
      description: 'Credenciales del broker MQTT asignadas a esta máquina para la comunicación en tiempo real. Son de uso interno — no las compartas.',
      side: 'top',
    },
  },
];

const MachineQRLabel = dynamic(() => import('@/components/MachineQRLabel'), { ssr: false });

// ── Tipos ────────────────────────────────────────────────────────────────────
type Period = 'day' | 'month' | 'year';

// ── Date helpers ─────────────────────────────────────────────────────────────
function toIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`;
}

function getPeriodRange(period: Period) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === 'day') {
    return {
      start:     toIso(new Date(Date.UTC(y, m, d - 6,  0,  0,  0))),
      end:       toIso(new Date(Date.UTC(y, m, d,     23, 59, 59))),
      prevStart: toIso(new Date(Date.UTC(y, m, d - 13, 0,  0,  0))),
      prevEnd:   toIso(new Date(Date.UTC(y, m, d - 7, 23, 59, 59))),
    };
  }
  if (period === 'month') {
    return {
      start:     toIso(new Date(Date.UTC(y, m,     1,  0,  0,  0))),
      end:       toIso(new Date(Date.UTC(y, m,     d, 23, 59, 59))),
      prevStart: toIso(new Date(Date.UTC(y, m - 1, 1,  0,  0,  0))),
      prevEnd:   toIso(new Date(Date.UTC(y, m,     0, 23, 59, 59))),
    };
  }
  return {
    start:     toIso(new Date(Date.UTC(y,     0,  1,  0,  0,  0))),
    end:       toIso(new Date(Date.UTC(y,     m,  d, 23, 59, 59))),
    prevStart: toIso(new Date(Date.UTC(y - 1, 0,  1,  0,  0,  0))),
    prevEnd:   toIso(new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59))),
  };
}

function generateIntervals(period: Period): { label: string; start: string; end: string }[] {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  if (period === 'day') {
    const d = now.getUTCDate();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.UTC(y, m, d - 6 + i));
      return {
        label: `${DAY_SHORT[date.getUTCDay()]} ${date.getUTCDate()}`,
        start: toIso(new Date(Date.UTC(y, m, d - 6 + i,  0,  0,  0))),
        end:   toIso(new Date(Date.UTC(y, m, d - 6 + i, 23, 59, 59))),
      };
    });
  }
  if (period === 'month') {
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return [
      { label: 'Sem 1', from: 1,  to: 7       },
      { label: 'Sem 2', from: 8,  to: 14      },
      { label: 'Sem 3', from: 15, to: 21      },
      { label: 'Sem 4', from: 22, to: lastDay },
    ].map(w => ({
      label: w.label,
      start: toIso(new Date(Date.UTC(y, m, w.from,  0,  0,  0))),
      end:   toIso(new Date(Date.UTC(y, m, w.to,   23, 59, 59))),
    }));
  }
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return Array.from({ length: 12 }, (_, i) => ({
    label: MONTHS[i],
    start: toIso(new Date(Date.UTC(y, i,     1,  0,  0,  0))),
    end:   toIso(new Date(Date.UTC(y, i + 1, 0, 23, 59, 59))),
  }));
}

// ── Helpers visuales ─────────────────────────────────────────────────────────
function clp(n: number) { return `$${n.toLocaleString('es-CL')}`; }
function clpShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-muted font-medium mb-0.5">{label}</p>
      <p className="font-bold text-dark text-sm">{clp(payload[0].value)}</p>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function MaquinaDetallePage() {
  const params = useParams();
  const machineId = params.id as string;

  const [machine, setMachine]   = useState<Machine | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [isQROpen, setIsQROpen] = useState(false);
  const [mqttOpen, setMqttOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied]     = useState<string | null>(null);
  const { rebootMachine, isLoading: rebootLoading, hasCredentials } = useMqttReboot();

  // Métricas
  const [period, setPeriod]         = useState<Period>('month');
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; value: number }[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const toggleReveal = (key: string) => setRevealed(p => ({ ...p, [key]: !p[key] }));
  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReboot = async () => {
    if (!machine) return;
    const confirmed = window.confirm(`¿Reiniciar la máquina "${machine.name}"?`);
    if (!confirmed) return;
    try { await rebootMachine(machine.id); } catch { /* ignorar */ }
  };

  // Carga datos de la máquina
  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    getMachineAction(machineId, { include: 'mqttUser,enterprise' })
      .then(result => {
        if (result.success && result.machine) setMachine(result.machine);
        else setError(result.error || 'Máquina no encontrada');
      })
      .catch(() => setError('Error al cargar la máquina'))
      .finally(() => setLoading(false));
  }, [machineId]);

  // Carga métricas cuando cambia el período o se carga la máquina
  useEffect(() => {
    if (!machineId) return;
    setLoadingMetrics(true);
    setAggCurrent(null);
    setAggPrev(null);
    setChartData([]);

    const id = Number(machineId);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const intervals = generateIntervals(period);

    Promise.all([
      aggregatePaymentsAction({ machine_id: id, start_date: start,     end_date: end     }),
      aggregatePaymentsAction({ machine_id: id, start_date: prevStart, end_date: prevEnd }),
      ...intervals.map(iv => aggregatePaymentsAction({ machine_id: id, start_date: iv.start, end_date: iv.end })),
    ]).then(([curr, prev, ...ivResults]) => {
      if (curr.success)  setAggCurrent({ total_amount: curr.total_amount ?? 0, total_count: curr.total_count ?? 0 });
      if (prev.success)  setAggPrev({ total_amount: prev.total_amount ?? 0, total_count: prev.total_count ?? 0 });
      setChartData(intervals.map((iv, i) => ({
        label: iv.label,
        value: ivResults[i]?.success ? (ivResults[i].total_amount ?? 0) : 0,
      })));
    })
    .catch(() => {})
    .finally(() => setLoadingMetrics(false));
  }, [machineId, period]);

  // ── Estado de carga ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell>
        <PageHeader icon={Monitor} title="Detalles de la Máquina" backHref="/maquinas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted">Cargando detalles de la máquina...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !machine) {
    return (
      <AppShell>
        <PageHeader icon={Monitor} title="Detalles de la Máquina" backHref="/maquinas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Monitor className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquina</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link href="/maquinas" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── KPIs calculados ────────────────────────────────────────────────────────
  const totalAmount    = aggCurrent?.total_amount ?? 0;
  const totalCount     = aggCurrent?.total_count  ?? 0;
  const avgTicket      = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const growthPct      = aggCurrent && aggPrev && (aggPrev.total_amount > 0)
    ? Math.round(((aggCurrent.total_amount - aggPrev.total_amount) / aggPrev.total_amount) * 100)
    : null;
  const periodLabel: Record<Period, string> = { day: '7 días', month: 'Este mes', year: 'Este año' };

  const getStatusColor = (s: string) =>
    s?.toLowerCase() === 'online' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  const getStatusLabel = (s: string) =>
    s?.toLowerCase() === 'online' ? 'En línea' : 'Fuera de línea';

  return (
    <AppShell>
      <PageHeader
        icon={Monitor}
        title={machine.name}
        subtitle="Información y métricas de la máquina"
        backHref="/maquinas"
        variant="white"
        actions={<TourRunner steps={MACHINE_DETAIL_TOUR} theme="light" />}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Action bar */}
          <div data-tour="machine-actions" className="flex flex-wrap items-center gap-2 group/actions">
            <button
              onClick={() => setIsQROpen(true)}
              title="Generar QR"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-sm font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
            >
              <QrCode className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Generar QR</span>
            </button>
            <Link
              href={`/maquinas/${machine.id}/slots`}
              title="Gestionar Slots"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-sm font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Gestionar Slots</span>
            </Link>
            <Link
              href={`/maquinas/${machine.id}/editar`}
              title="Editar máquina"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-sm font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
            >
              <Edit className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
            <Link
              href={`/pagos?machine_id=${machine.id}`}
              title="Ver pagos de esta máquina"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-sm font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Ver pagos</span>
            </Link>
            <button
              onClick={handleReboot}
              disabled={rebootLoading || !hasCredentials}
              title="Reiniciar máquina"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-red-200 text-red-600 text-sm font-semibold bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-4 w-4 shrink-0 ${rebootLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{rebootLoading ? 'Reiniciando...' : 'Reiniciar'}</span>
            </button>
          </div>

          {/* ── MÉTRICAS DE VENTAS ── */}
          <div data-tour="machine-metrics" className="card overflow-hidden">
            {/* Header con selector de período */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-dark">Métricas de ventas</h3>
                <HelpTooltip text="Ventas e ingresos de esta máquina en el período seleccionado, comparados con el período anterior equivalente." side="right" />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(['day', 'month', 'year'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      period === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {/* Ingresos */}
              <div className="px-5 py-4">
                <p className="text-xs text-muted mb-1 flex items-center gap-1">
                  Ingresos
                  <HelpTooltip text="Total vendido en el período. El porcentaje indica la variación vs el período anterior equivalente." side="top" />
                </p>
                {loadingMetrics
                  ? <div className="h-7 w-28 bg-gray-100 rounded animate-pulse" />
                  : <p className="text-xl font-bold text-dark">{clp(totalAmount)}</p>
                }
                {!loadingMetrics && growthPct !== null && (
                  <p className={`text-xs font-semibold mt-0.5 flex items-center gap-0.5 ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {growthPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {growthPct >= 0 ? '+' : ''}{growthPct}% vs período anterior
                  </p>
                )}
              </div>
              {/* Ventas */}
              <div className="px-5 py-4">
                <p className="text-xs text-muted mb-1">Ventas</p>
                {loadingMetrics
                  ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                  : <p className="text-xl font-bold text-dark">{totalCount.toLocaleString('es-CL')}</p>
                }
                <p className="text-xs text-muted mt-0.5">transacciones</p>
              </div>
              {/* Ticket promedio */}
              <div className="px-5 py-4">
                <p className="text-xs text-muted mb-1 flex items-center gap-1">
                  Ticket promedio
                  <HelpTooltip text="Ingreso promedio por transacción: total vendido ÷ número de ventas." side="top" />
                </p>
                {loadingMetrics
                  ? <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
                  : <p className="text-xl font-bold text-dark">{clp(avgTicket)}</p>
                }
                <p className="text-xs text-muted mt-0.5">por venta</p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="px-4 pb-4">
              {loadingMetrics ? (
                <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
              ) : chartData.every(d => d.value === 0) ? (
                <div className="h-44 flex items-center justify-center text-sm text-muted bg-gray-50 rounded-xl">
                  Sin ventas en este período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="areaGradM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3157b2" stopOpacity={0.25} />
                        <stop offset="90%" stopColor="#3157b2" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={48} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3157b2', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="value" stroke="#3157b2" strokeWidth={2.5}
                      fill="url(#areaGradM)" dot={false}
                      activeDot={{ r: 5, fill: '#3157b2', stroke: 'white', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── INFORMACIÓN DE LA MÁQUINA ── */}
          <div data-tour="machine-info" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-primary" />
                Información de la Máquina
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Nombre</label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-dark">{machine.name}</p>
                    <span className="text-xs font-mono text-muted bg-gray-100 px-1.5 py-0.5 rounded">ID: {machine.id}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Ubicación</label>
                  <p className="text-dark flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600 mt-0.5" />
                    <span className="whitespace-pre-line">{machine.location}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Tipo</label>
                  <p className="text-dark">{machine.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Empresa</label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-dark">{machine.enterprise?.name ?? '—'}</p>
                    <span className="text-xs font-mono text-muted bg-gray-100 px-1.5 py-0.5 rounded">ID: {machine.enterprise_id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Estado y Conexión
                <HelpTooltip text="Estado: indica si la máquina puede procesar ventas. Conexión MQTT: indica si el canal de comunicación en tiempo real está activo (necesario para reiniciar o recibir notificaciones)." side="top" />
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(machine.status)}`}>
                    <Activity className="h-3 w-3 mr-1" />
                    {getStatusLabel(machine.status)}
                  </span>
                </div>
                <div>
                  {machine?.mqtt_user?.connection_status ? (
                    <div className="flex items-center text-green-500">
                      <Wifi className="h-5 w-5 mr-2" />
                      <span>Conectado</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <WifiOff className="h-5 w-5 mr-2" />
                      <span>Desconectado</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Fecha de Creación</label>
                  <p className="text-dark flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    {new Date(machine.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Última Actualización</label>
                  <p className="text-dark flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    {new Date(machine.updated_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MQTT Credentials */}
          {machine.mqtt_user && (
            <div data-tour="machine-mqtt" className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setMqttOpen(p => !p)}
                className="w-full px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-dark">Credenciales MQTT</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 font-medium">Avanzado</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mqttOpen ? 'rotate-180' : ''}`} />
              </button>

              {mqttOpen && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                  {([
                    { key: 'username',  label: 'Usuario',     value: machine.mqtt_user.username,                         sensitive: false },
                    { key: 'password',  label: 'Contraseña',  value: machine.mqtt_user.original_password ?? '—',         sensitive: true  },
                    { key: 'client_id', label: 'Client ID',   value: machine.mqtt_user.client_id || 'No asignado',       sensitive: false },
                  ] as { key: string; label: string; value: string; sensitive: boolean }[]).map(({ key, label, value, sensitive }) => {
                    const isRevealed = revealed[key];
                    const display    = sensitive && !isRevealed ? '•'.repeat(Math.min(value.length, 16)) : value;
                    const isCopied   = copied === key;
                    return (
                      <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs text-muted mb-0.5">{label}</p>
                          <p className={`text-sm font-mono font-medium text-dark select-none ${sensitive && !isRevealed ? 'tracking-widest' : ''}`}>
                            {display}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {sensitive && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(key)}
                              title={isRevealed ? 'Ocultar' : 'Revelar'}
                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyField(key, value)}
                            title="Copiar"
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            {isCopied
                              ? <Check className="h-3.5 w-3.5 text-green-500" />
                              : <Copy className="h-3.5 w-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isQROpen && machine && (
        <MachineQRLabel machine={machine} onClose={() => setIsQROpen(false)} />
      )}
    </AppShell>
  );
}
