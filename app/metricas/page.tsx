'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Package, Monitor, Building2,
  ShoppingCart, AlertTriangle, BarChart2, Activity,
  ArrowUpRight, Star, LineChart as LineChartIcon,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { AppShell, PageHeader } from '@/components/ui-custom';
import { useUser } from '@/lib/stores/authStore';
import { aggregatePaymentsAction, productRankingAction, machineRankingAction } from '@/lib/actions/payments';
import type { RankedProduct, RankedMachine, AggregateDataPoint } from '@/lib/actions/payments';
import { getMachinesAction } from '@/lib/actions/machines';
import type { Machine } from '@/lib/interfaces/machine.interface';
import { TourRunner, type Step } from '@/components/help/TourRunner';
import { HelpTooltip } from '@/components/help/HelpTooltip';

const METRICS_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="period-selector"]',
    popover: {
      title: 'Período de análisis',
      description: 'Selecciona el rango de tiempo: últimos 7 días, mes actual o año completo. Todos los datos se actualizan automáticamente al cambiar.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="metrics-tabs"]',
    popover: {
      title: 'Vistas de análisis',
      description: 'Cambia entre Resumen (KPIs y gráfico), Máquinas (rendimiento por máquina), Productos (ranking de ventas) y Stock (inventario).',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="kpi-cards"]',
    popover: {
      title: 'Indicadores clave (KPIs)',
      description: 'Ventas totales, número de transacciones, ticket promedio y crecimiento vs el período anterior equivalente. Los datos se obtienen en tiempo real.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="sales-chart"]',
    popover: {
      title: 'Gráfico de ventas',
      description: 'Evolución de ingresos en el período. Toca o pasa el cursor sobre los puntos para ver los valores exactos de cada día o mes.',
      side: 'top',
    },
  },
];

// ──────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────
type Period = 'day' | 'month' | 'year';
type Tab    = 'resumen' | 'maquinas' | 'productos' | 'stock';

// ──────────────────────────────────────────────────────────────
// DATE HELPERS
// ──────────────────────────────────────────────────────────────
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
    // últimos 7 días (hoy inclusive) vs 7 días anteriores
    const start     = new Date(Date.UTC(y, m, d - 6, 0, 0, 0));
    const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
    const prevStart = new Date(Date.UTC(y, m, d - 13, 0, 0, 0));
    const prevEnd   = new Date(Date.UTC(y, m, d - 7, 23, 59, 59));
    return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
  }

  if (period === 'month') {
    const start     = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
    const prevStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const prevEnd   = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
  }

  // year — año calendario actual: 1 ene → hoy
  const start     = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
  const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
  const prevStart = new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0));
  const prevEnd   = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59));
  return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
}

// group_by a usar según el período seleccionado
function getGroupBy(period: Period): 'day' | 'month' {
  return period === 'year' ? 'month' : 'day';
}

// ──────────────────────────────────────────────────────────────
// FORMATEO DE FECHAS DEL API → LABELS DEL GRÁFICO
// ──────────────────────────────────────────────────────────────
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_SHORT   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatGroupDate(dateStr: string, groupBy: 'day' | 'month', period: Period): string {
  if (groupBy === 'month') {
    // "2026-02" → "Feb"
    const parts = dateStr.split('-');
    return MONTH_SHORT[parseInt(parts[1]) - 1] ?? dateStr;
  }
  // groupBy === 'day': "2026-02-27"
  const parts = dateStr.split('-');
  const dayNum = parseInt(parts[2]);
  if (period === 'month') {
    // solo el número de día: "1", "15", etc.
    return String(dayNum);
  }
  // period === 'day' (últimos 7 días): "Jue 27"
  const dt = new Date(`${dateStr}T12:00:00Z`);
  return `${DAY_SHORT[dt.getUTCDay()]} ${dayNum}`;
}

function mapGroupedData(
  points: AggregateDataPoint[] | undefined,
  groupBy: 'day' | 'month',
  period: Period,
): { label: string; value: number }[] {
  return (points ?? []).map(pt => ({
    label: formatGroupDate(pt.date, groupBy, period),
    value: pt.total_amount,
  }));
}


// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
function clp(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}
function clpShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const INSIGHT_LABELS: Record<Period, [string, string, string]> = {
  day:   ['Mejor día',   'Día más bajo',   'Promedio/día'],
  month: ['Mejor día',   'Día más bajo',   'Promedio/día'],
  year:  ['Mejor mes',   'Mes más bajo',   'Promedio/mes'],
};

function computeInsights(period: Period, data: { label: string; value: number }[]) {
  const [l0, l1, l2] = INSIGHT_LABELS[period];
  if (!data.length) return [
    { label: l0, value: '—', sub: '—' },
    { label: l1, value: '—', sub: '—' },
    { label: l2, value: '—', sub: '—' },
  ];
  const max = data.reduce((a, b) => b.value > a.value ? b : a);
  const min = data.reduce((a, b) => b.value < a.value ? b : a);
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  const subLabel = period === 'year' ? `${data.length} meses` : `${data.length} días`;
  return [
    { label: l0, value: max.label, sub: clp(max.value) },
    { label: l1, value: min.label, sub: clp(min.value) },
    { label: l2, value: clp(avg),  sub: subLabel        },
  ];
}

// ──────────────────────────────────────────────────────────────
// UI HELPERS
// ──────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse" />;
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

function SalesBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 4 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4c6fd0" />
            <stop offset="100%" stopColor="#3157b2" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(49,87,178,0.06)', radius: 6 }} />
        {max > 0 && <ReferenceLine y={max} stroke="#3157b2" strokeDasharray="4 4" strokeOpacity={0.3} />}
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SalesAreaChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3157b2" stopOpacity={0.25} />
            <stop offset="90%" stopColor="#3157b2" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3157b2', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3157b2"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#3157b2', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniChart({ data, id }: { data: { label: string; value: number }[]; id: string }) {
  const hasData = data.some(d => d.value > 0);
  if (!hasData) {
    return <div className="h-14 flex items-center justify-center text-xs text-gray-300">Sin datos</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`mg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3157b2" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#3157b2" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#3157b2" strokeWidth={1.5}
          fill={`url(#mg-${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ──────────────────────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function MetricasPage() {
  const user = useUser();
  const [period, setPeriod]     = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  // Datos reales del endpoint aggregate
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading]       = useState(true);

  // Máquinas
  type MachineStats = Machine & { total_amount: number; total_count: number; sparkline: { label: string; value: number }[] };
  const [machines, setMachines]         = useState<Machine[]>([]);
  const [machineStats, setMachineStats] = useState<MachineStats[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  // Product ranking (para tab Productos)
  const [rankingTop, setRankingTop]       = useState<RankedProduct[]>([]);
  const [rankingLow, setRankingLow]       = useState<RankedProduct[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  // Machine ranking (para tab Máquinas — Mayor/Menor rendimiento)
  const [machineRankingTop, setMachineRankingTop] = useState<RankedMachine[]>([]);
  const [machineRankingLow, setMachineRankingLow] = useState<RankedMachine[]>([]);
  const [loadingMachineRanking, setLoadingMachineRanking] = useState(true);


  useEffect(() => {
    if (user?.role !== 'customer') return;

    setLoading(true);
    setAggCurrent(null);
    setAggPrev(null);
    setChartData([]);

    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const groupBy      = getGroupBy(period);
    const enterpriseId = user.enterprises?.[0]?.id;
    const base         = enterpriseId != null ? { enterprise_id: enterpriseId } : {};

    Promise.all([
      aggregatePaymentsAction({ ...base, start_date: start,     end_date: end     }),
      aggregatePaymentsAction({ ...base, start_date: prevStart, end_date: prevEnd }),
      aggregatePaymentsAction({ ...base, start_date: start,     end_date: end,    group_by: groupBy }),
    ])
      .then(([curr, prev, chart]) => {
        if (curr?.success && curr.total_amount !== undefined) {
          setAggCurrent({ total_amount: curr.total_amount, total_count: curr.total_count ?? 0 });
        }
        if (prev?.success && prev.total_amount !== undefined) {
          setAggPrev({ total_amount: prev.total_amount, total_count: prev.total_count ?? 0 });
        }
        if (chart?.success) {
          setChartData(mapGroupedData(chart.data, groupBy, period));
        }
      })
      .catch(() => {
        // En error de red/transporte: dejar chartData vacío, los KPIs mostrarán $0
      })
      .finally(() => setLoading(false));
  }, [period, user]);

  // Carga lista de máquinas (una sola vez al montar)
  useEffect(() => {
    if (user?.role !== 'customer') return;
    const enterpriseId = user.enterprises?.[0]?.id;
    getMachinesAction({ enterprise_id: enterpriseId, limit: 100 })
      .then(res => { if (res.success) setMachines(res.machines ?? []); })
      .catch(() => {});
  }, [user]);

  // Carga stats + sparklines por máquina cuando cambia el período o la lista
  useEffect(() => {
    if (!machines.length) { setLoadingMachines(false); return; }

    setLoadingMachines(true);
    setMachineStats([]);

    const { start, end } = getPeriodRange(period);
    const groupBy      = getGroupBy(period);
    const enterpriseId = user?.enterprises?.[0]?.id;
    const base         = enterpriseId != null ? { enterprise_id: enterpriseId } : {};

    // Una sola llamada agrupada por máquina — incluye total + puntos del sparkline
    Promise.all(
      machines.map(m =>
        aggregatePaymentsAction({ ...base, machine_id: m.id, start_date: start, end_date: end, group_by: groupBy })
      )
    )
      .then(results => {
        setMachineStats(machines.map((m, i) => ({
          ...m,
          total_amount: results[i]?.success ? (results[i].total_amount ?? 0) : 0,
          total_count:  results[i]?.success ? (results[i].total_count  ?? 0) : 0,
          sparkline: mapGroupedData(results[i]?.data, groupBy, period),
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingMachines(false));
  }, [period, machines, user]);

  // Carga product ranking cuando cambia el período
  useEffect(() => {
    if (user?.role !== 'customer') return;
    setLoadingRanking(true);
    const { start, end } = getPeriodRange(period);
    productRankingAction({ start_date: start, end_date: end, limit: 5 })
      .then(res => {
        if (res.success) {
          setRankingTop(res.top_performers ?? []);
          setRankingLow(res.low_performers ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [period, user]);

  // Carga machine ranking cuando cambia el período
  useEffect(() => {
    if (user?.role !== 'customer') return;
    setLoadingMachineRanking(true);
    const { start, end } = getPeriodRange(period);
    machineRankingAction({ start_date: start, end_date: end, limit: 5 })
      .then(res => {
        if (res.success) {
          setMachineRankingTop(res.top_performers ?? []);
          setMachineRankingLow(res.low_performers ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMachineRanking(false));
  }, [period, user]);


  if (user?.role !== 'customer') {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">Sección exclusiva para clientes</h1>
            <p className="text-gray-500 text-sm">Esta sección está disponible únicamente para usuarios con rol Cliente.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── KPI calculados ────────────────────────────────────────
  const totalAmount    = aggCurrent?.total_amount ?? 0;
  const totalCount     = aggCurrent?.total_count  ?? 0;
  const avgTicket      = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const growthPct      = (aggCurrent && aggPrev && aggPrev.total_amount > 0)
    ? Math.round(((aggCurrent.total_amount - aggPrev.total_amount) / aggPrev.total_amount) * 100)
    : null;
  const growthAvailable = growthPct !== null;
  const growthPositive  = (growthPct ?? 0) >= 0;
  const insights       = computeInsights(period, chartData);

  const periodLabel: Record<Period, string> = { day: '7 días', month: 'Este mes', year: 'Este año' };
  const enterpriseName = user.enterprises?.[0]?.name ?? 'Tu empresa';

  const chartTitle: Record<Period, { title: string; subtitle: string }> = {
    day:   { title: 'Ventas por día · Últimos 7 días', subtitle: 'Distribución diaria de ingresos de los últimos 7 días' },
    month: { title: 'Ventas por día · Este mes',       subtitle: 'Distribución diaria de ingresos del mes actual'        },
    year:  { title: 'Ventas por mes · Este año',       subtitle: 'Tendencia mensual de ingresos del año en curso'        },
  };

  const tabs: { id: Tab; label: string; icon: typeof Monitor; disabled?: boolean }[] = [
    { id: 'resumen',   label: 'Resumen',   icon: LineChartIcon },
    { id: 'maquinas',  label: 'Máquinas',  icon: Monitor       },
    { id: 'productos', label: 'Productos', icon: ShoppingCart  },
    { id: 'stock',     label: 'Stock',     icon: Package,      disabled: true },
  ];

  return (
    <AppShell>
      {/* Header con selector de período */}
      <PageHeader
        icon={LineChartIcon}
        title="Métricas"
        subtitle={
          <span className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            {enterpriseName}
          </span> as unknown as string
        }
        variant="gradient"
        actions={
          <div className="flex items-center gap-2">
            <TourRunner steps={METRICS_TOUR_STEPS} />
            <div data-tour="period-selector" className="flex items-center gap-1 bg-white/15 rounded-lg p-1">
              {(['day', 'month', 'year'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    period === p
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {periodLabel[p]}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Tab bar */}
      <div data-tour="metrics-tabs" className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="flex px-4 sm:px-6 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab.disabled
                  ? 'border-transparent text-gray-400 opacity-40 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.disabled && (
                <span className="hidden sm:inline ml-0.5 text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-400 font-normal leading-none">Próx.</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-6">

        {/* ══════════════════════════════════════
            TAB: RESUMEN
        ══════════════════════════════════════ */}
        {activeTab === 'resumen' && (
          <>
            {/* KPIs — datos reales del endpoint aggregate */}
            <div data-tour="kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ventas totales — real */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-muted mb-1 font-medium">Ventas totales</p>
                    {loading
                      ? <KpiSkeleton />
                      : <p className="text-lg sm:text-xl font-bold text-dark truncate">{clp(totalAmount)}</p>
                    }
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                  <span>{periodLabel[period]}</span>
                </div>
              </div>

              {/* N° de ventas — real */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-muted mb-1 font-medium">N° de ventas</p>
                    {loading
                      ? <KpiSkeleton />
                      : <p className="text-lg sm:text-xl font-bold text-dark truncate">{totalCount.toLocaleString('es-CL')}</p>
                    }
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50 flex-shrink-0">
                    <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                  <span>{periodLabel[period]}</span>
                </div>
              </div>

              {/* Ticket promedio — calculado de datos reales */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-muted mb-1 font-medium flex items-center gap-1">
                      Ticket promedio
                      <HelpTooltip text="Monto promedio por transacción: ventas totales ÷ número de ventas. Indica el valor típico de cada compra." side="bottom" />
                    </p>
                    {loading
                      ? <KpiSkeleton />
                      : <p className="text-lg sm:text-xl font-bold text-dark truncate">{clp(avgTicket)}</p>
                    }
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 flex-shrink-0">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                  <span>por transacción</span>
                </div>
              </div>

              {/* Crecimiento — calculado de dos llamadas */}
              <div className={`card p-4 sm:p-5 transition-opacity ${!loading && !growthAvailable ? 'opacity-40' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-muted mb-1 font-medium flex items-center gap-1">
                      Crecimiento
                      <HelpTooltip text="Variación porcentual vs el período anterior equivalente. Ej: para «Este mes» compara con el mes pasado en el mismo rango de días." side="bottom" />
                    </p>
                    {loading
                      ? <KpiSkeleton />
                      : growthAvailable
                        ? <p className={`text-lg sm:text-xl font-bold truncate ${growthPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {growthPositive ? '+' : ''}{growthPct}%
                          </p>
                        : <p className="text-lg sm:text-xl font-bold text-gray-400">—</p>
                    }
                  </div>
                  <div className={`p-2 rounded-xl flex-shrink-0 ${growthAvailable && !growthPositive ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {growthAvailable && !growthPositive
                      ? <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      : <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    }
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-muted">
                  <span>{growthAvailable ? 'vs período anterior' : 'sin datos anteriores'}</span>
                </div>
              </div>
            </div>

            {/* ── Gráfico de ventas vs tiempo ── */}
            <div data-tour="sales-chart" className="card overflow-hidden">
              {/* Header */}
              <div className="page-header-gradient px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {chartTitle[period].title}
                  </h2>
                  <p className="text-white/65 text-xs mt-0.5">{chartTitle[period].subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/60 text-xs">Total {periodLabel[period]}</p>
                  {loading
                    ? <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse mt-0.5" />
                    : <p className="text-2xl font-bold text-white leading-tight">{clpShort(totalAmount)}</p>
                  }
                </div>
              </div>

              {/* Gráfico */}
              <div className="px-2 sm:px-4 pt-4 pb-2">
                {loading
                  ? <div className="h-[240px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-muted">Cargando datos...</p>
                      </div>
                    </div>
                  : period === 'day'
                    ? <SalesBarChart  data={chartData} />
                    : <SalesAreaChart data={chartData} />
                }
              </div>

              {/* Insights */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                {insights.map((ins, i) => (
                  <div key={i} className="p-4 text-center">
                    <p className="text-xs text-muted mb-1">{ins.label}</p>
                    {loading
                      ? <div className="h-5 w-16 bg-gray-100 rounded animate-pulse mx-auto my-0.5" />
                      : <p className="text-sm sm:text-base font-bold text-dark">{ins.value}</p>
                    }
                    {loading
                      ? <div className="h-3.5 w-12 bg-gray-100 rounded animate-pulse mx-auto mt-1" />
                      : <p className="text-xs text-muted mt-0.5">{ins.sub}</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: MÁQUINAS
        ══════════════════════════════════════ */}
        {activeTab === 'maquinas' && (() => {
          const sorted     = [...machineStats].sort((a, b) => b.total_amount - a.total_amount);
          const grandTotal = sorted.reduce((s, m) => s + m.total_amount, 0);
          return (
            <>
              {/* Lista de máquinas con sparkline */}
              {loadingMachines ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 bg-gray-100 rounded" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-4 w-40 bg-gray-100 rounded" />
                          <div className="h-3 w-28 bg-gray-100 rounded" />
                        </div>
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                      </div>
                      <div className="mt-3 h-14 bg-gray-50 rounded" />
                    </div>
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="card p-10 text-center">
                  <Monitor className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted">No hay máquinas registradas</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-dark">Ventas por máquina · {periodLabel[period]}</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {sorted.map((m, i) => {
                      const pct = grandTotal > 0 ? Math.round((m.total_amount / grandTotal) * 100) : 0;
                      return (
                        <div key={m.id} className="px-5 py-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-muted w-5 flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/maquinas/${m.id}`} className="font-semibold text-dark text-sm truncate hover:text-primary hover:underline">{m.name}</Link>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded-full border flex-shrink-0 ${
                                  m.status === 'online'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {m.status === 'online' ? 'En línea' : 'Offline'}
                                </span>
                              </div>
                              <p className="text-xs text-muted truncate">{m.location}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-dark text-sm">{clp(m.total_amount)}</p>
                              <p className="text-xs text-muted">{m.total_count.toLocaleString('es-CL')} ventas · {pct}%</p>
                            </div>
                          </div>
                          <div className="ml-8">
                            <MiniChart data={m.sparkline} id={String(m.id)} />
                          </div>
                          <div className="ml-8 mt-1 flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1">
                              <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mayor / Menor rendimiento — desde machine ranking endpoint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-dark flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Mayor rendimiento
                  </h3>
                  {loadingMachineRanking
                    ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-3 w-20 bg-gray-100 rounded" />
                          </div>
                          <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                      ))}</div>
                    : machineRankingTop.length === 0
                      ? <p className="text-sm text-muted text-center py-4">Sin datos para este período</p>
                      : <div className="space-y-3">
                          {machineRankingTop.map((m, i) => (
                            <Link key={m.id} href={`/maquinas/${m.id}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                                {m.location && <p className="text-xs text-muted truncate">{m.location}</p>}
                                <p className="text-xs text-muted">{m.payments_quantity.toLocaleString('es-CL')} ventas</p>
                              </div>
                              <p className="font-bold text-dark text-sm flex-shrink-0">{clpShort(m.payments_amount)}</p>
                            </Link>
                          ))}
                        </div>
                  }
                </div>
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-dark flex items-center gap-2 mb-4">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Menor rendimiento
                  </h3>
                  {loadingMachineRanking
                    ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-3 w-20 bg-gray-100 rounded" />
                          </div>
                          <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                      ))}</div>
                    : machineRankingLow.length === 0
                      ? <p className="text-sm text-muted text-center py-4">Sin datos para este período</p>
                      : <div className="space-y-3">
                          {machineRankingLow.map((m, i) => (
                            <Link key={m.id} href={`/maquinas/${m.id}`} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                              <span className="w-6 h-6 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                                {m.location && <p className="text-xs text-muted truncate">{m.location}</p>}
                                <p className="text-xs text-muted">{m.payments_quantity.toLocaleString('es-CL')} ventas</p>
                              </div>
                              <p className="font-bold text-dark text-sm flex-shrink-0">{clpShort(m.payments_amount)}</p>
                            </Link>
                          ))}
                        </div>
                  }
                </div>
              </div>
            </>
          );
        })()}

        {/* ══════════════════════════════════════
            TAB: PRODUCTOS
        ══════════════════════════════════════ */}
        {activeTab === 'productos' && (() => {
          const maxTop = rankingTop[0]?.payments_amount || 1;

          if (loadingRanking) return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[0, 1].map(col => (
                <div key={col} className="card p-5 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="h-3 w-3 bg-gray-100 rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-36 bg-gray-100 rounded" />
                        <div className="h-2 bg-gray-100 rounded" />
                      </div>
                      <div className="h-4 w-14 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );

          if (!rankingTop.length && !rankingLow.length) return (
            <div className="card p-10 text-center">
              <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted">Sin datos de productos para este período</p>
            </div>
          );

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top performers */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-dark">Más vendidos · {periodLabel[period]}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {rankingTop.map((p, i) => {
                    const pct = Math.round((p.payments_amount / maxTop) * 100);
                    return (
                      <Link key={p.id} href={`/productos/${p.id}`} className="block px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-muted w-5 flex-shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark truncate">{p.name}</p>
                            <p className="text-xs text-muted">{p.payments_quantity.toLocaleString('es-CL')} ventas</p>
                          </div>
                          <p className="text-sm font-bold text-dark flex-shrink-0">{clpShort(p.payments_amount)}</p>
                        </div>
                        <div className="ml-7 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted w-8 text-right">{pct}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Low performers */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-semibold text-dark">Menos vendidos · {periodLabel[period]}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {rankingLow.map((p, i) => (
                    <Link key={p.id} href={`/productos/${p.id}`} className="block px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted w-5 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark truncate">{p.name}</p>
                          <p className="text-xs text-muted">{p.payments_quantity.toLocaleString('es-CL')} ventas</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-dark">{clpShort(p.payments_amount)}</p>
                          {p.payments_amount === 0 && (
                            <p className="text-xs text-red-500 font-semibold">Sin ventas</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════
            TAB: STOCK — Próximamente
        ══════════════════════════════════════ */}
        {activeTab === 'stock' && (
          <div className="card p-10 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-dark mb-1">Stock · Próximamente</h3>
            <p className="text-sm text-muted max-w-xs mx-auto">Esta sección estará disponible cuando la API de inventario esté integrada.</p>
          </div>
        )}

      </main>
    </AppShell>
  );
}
