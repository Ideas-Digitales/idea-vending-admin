'use client';

import { useState } from 'react';
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

// ──────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────
type Period = 'day' | 'month' | 'year';
type Tab    = 'resumen' | 'maquinas' | 'productos' | 'stock';

// ──────────────────────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────────────────────
const empresa = { name: 'Empresa Demo SPA' };

const salesByPeriod: Record<Period, { total: number; count: number; avgTicket: number; delta: number }> = {
  day:   { total: 1_280_000,   count: 43,     avgTicket: 29_767, delta: 12 },
  month: { total: 28_450_000,  count: 892,    avgTicket: 31_894, delta: 8  },
  year:  { total: 312_800_000, count: 10_234, avgTicket: 30_562, delta: 23 },
};

// Datos del gráfico protagonista — coherentes con el período
const chartData: Record<Period, { label: string; value: number }[]> = {
  day: [
    { label: '8h',  value: 28_000  },
    { label: '9h',  value: 55_000  },
    { label: '10h', value: 92_000  },
    { label: '11h', value: 118_000 },
    { label: '12h', value: 145_000 },
    { label: '13h', value: 125_000 },
    { label: '14h', value: 98_000  },
    { label: '15h', value: 112_000 },
    { label: '16h', value: 138_000 },
    { label: '17h', value: 158_000 },
    { label: '18h', value: 145_000 },
    { label: '19h', value: 112_000 },
    { label: '20h', value: 54_000  },
  ],
  month: [
    { label: '1',  value:   680_000 },
    { label: '2',  value:   720_000 },
    { label: '3',  value:   810_000 },
    { label: '4',  value:   780_000 },
    { label: '5',  value:   900_000 },
    { label: '6',  value:   680_000 },
    { label: '7',  value:   630_000 },
    { label: '8',  value:   840_000 },
    { label: '9',  value:   950_000 },
    { label: '10', value: 1_100_000 },
    { label: '11', value: 1_080_000 },
    { label: '12', value: 1_200_000 },
    { label: '13', value:   980_000 },
    { label: '14', value:   950_000 },
    { label: '15', value: 1_100_000 },
    { label: '16', value: 1_200_000 },
    { label: '17', value: 1_350_000 },
    { label: '18', value: 1_300_000 },
    { label: '19', value: 1_450_000 },
    { label: '20', value: 1_280_000 },
    { label: '21', value: 1_220_000 },
    { label: '22', value:   980_000 },
    { label: '23', value: 1_050_000 },
    { label: '24', value: 1_120_000 },
    { label: '25', value: 1_080_000 },
    { label: '26', value: 1_200_000 },
    { label: '27', value:   960_000 },
    { label: '28', value:   860_000 },
  ],
  year: [
    { label: 'Mar', value: 21_500_000 },
    { label: 'Abr', value: 23_800_000 },
    { label: 'May', value: 25_400_000 },
    { label: 'Jun', value: 24_100_000 },
    { label: 'Jul', value: 26_800_000 },
    { label: 'Ago', value: 28_200_000 },
    { label: 'Sep', value: 22_400_000 },
    { label: 'Oct', value: 19_800_000 },
    { label: 'Nov', value: 24_500_000 },
    { label: 'Dic', value: 31_200_000 },
    { label: 'Ene', value: 26_800_000 },
    { label: 'Feb', value: 38_300_000 },
  ],
};

const chartMeta: Record<Period, { title: string; subtitle: string; insights: { label: string; value: string; sub: string }[] }> = {
  day: {
    title: 'Ventas por hora · Hoy',
    subtitle: 'Distribución de ingresos a lo largo del día',
    insights: [
      { label: 'Hora punta',    value: '17:00 h',  sub: '$158.000'  },
      { label: 'Hora más baja', value: '8:00 h',   sub: '$28.000'   },
      { label: 'Promedio/hora', value: '$98.000',  sub: '13 tramos' },
    ],
  },
  month: {
    title: 'Ventas por día · Este mes',
    subtitle: 'Evolución diaria de ingresos del mes actual',
    insights: [
      { label: 'Mejor día',    value: 'Día 19',    sub: '$1.450.000'   },
      { label: 'Día más bajo', value: 'Día 7',     sub: '$630.000'     },
      { label: 'Promedio/día', value: '$1.016.000', sub: '28 días'     },
    ],
  },
  year: {
    title: 'Ventas por mes · Este año',
    subtitle: 'Tendencia mensual de ingresos en los últimos 12 meses',
    insights: [
      { label: 'Mejor mes',    value: 'Feb 2026',  sub: '$38.300.000' },
      { label: 'Mes más bajo', value: 'Oct 2025',  sub: '$19.800.000' },
      { label: 'Crecimiento',  value: '+78%',      sub: 'Mar → Feb'  },
    ],
  },
};

const machineRows: Record<Period, { id: number; name: string; location: string; status: string; sales: number; count: number; stock: number }[]> = {
  day: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 398_000,    count: 14,    stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 320_000,    count: 11,    stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 260_000,    count: 9,     stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 192_000,    count: 6,     stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 110_000,    count: 3,     stock: 67 },
  ],
  month: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 8_900_000,  count: 287,   stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 7_200_000,  count: 219,   stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 5_800_000,  count: 178,   stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 4_200_000,  count: 134,   stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 2_350_000,  count: 74,    stock: 67 },
  ],
  year: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 98_200_000, count: 3_124, stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 79_400_000, count: 2_413, stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 64_100_000, count: 1_978, stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 46_500_000, count: 1_489, stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 24_600_000, count: 830,   stock: 67 },
  ],
};

const productRows: Record<Period, {
  top:    { name: string; sku: string; units: number; revenue: number }[];
  bottom: { name: string; sku: string; units: number; revenue: number }[];
}> = {
  day: {
    top: [
      { name: 'Bebida Energética 250ml', sku: 'BEB-001', units: 12, revenue: 180_000 },
      { name: 'Agua Mineral 500ml',      sku: 'AGU-001', units: 10, revenue:  70_000 },
      { name: 'Snack de Nueces',         sku: 'SNA-001', units: 8,  revenue: 128_000 },
      { name: 'Jugo Natural Naranja',    sku: 'JUG-001', units: 7,  revenue: 105_000 },
      { name: 'Barra Energética',        sku: 'BAR-001', units: 4,  revenue:  72_000 },
    ],
    bottom: [
      { name: 'Café Soluble',      sku: 'CAF-001', units: 1, revenue: 18_000 },
      { name: 'Pastillas Menta',   sku: 'MEN-001', units: 1, revenue:  5_000 },
      { name: 'Chicle Sin Azúcar', sku: 'CHI-001', units: 0, revenue:      0 },
    ],
  },
  month: {
    top: [
      { name: 'Bebida Energética 250ml', sku: 'BEB-001', units: 312, revenue: 4_680_000 },
      { name: 'Agua Mineral 500ml',      sku: 'AGU-001', units: 287, revenue: 2_009_000 },
      { name: 'Snack de Nueces',         sku: 'SNA-001', units: 198, revenue: 3_168_000 },
      { name: 'Jugo Natural Naranja',    sku: 'JUG-001', units: 154, revenue: 2_310_000 },
      { name: 'Barra Energética',        sku: 'BAR-001', units: 89,  revenue: 1_602_000 },
    ],
    bottom: [
      { name: 'Café Soluble',      sku: 'CAF-001', units: 23, revenue: 414_000 },
      { name: 'Pastillas Menta',   sku: 'MEN-001', units: 18, revenue:  90_000 },
      { name: 'Chicle Sin Azúcar', sku: 'CHI-001', units: 12, revenue:  48_000 },
    ],
  },
  year: {
    top: [
      { name: 'Bebida Energética 250ml', sku: 'BEB-001', units: 3_456, revenue: 51_840_000 },
      { name: 'Agua Mineral 500ml',      sku: 'AGU-001', units: 3_102, revenue: 21_714_000 },
      { name: 'Snack de Nueces',         sku: 'SNA-001', units: 2_187, revenue: 34_992_000 },
      { name: 'Jugo Natural Naranja',    sku: 'JUG-001', units: 1_843, revenue: 27_645_000 },
      { name: 'Barra Energética',        sku: 'BAR-001', units: 987,   revenue: 17_766_000 },
    ],
    bottom: [
      { name: 'Café Soluble',      sku: 'CAF-001', units: 267, revenue: 4_806_000 },
      { name: 'Pastillas Menta',   sku: 'MEN-001', units: 201, revenue: 1_005_000 },
      { name: 'Chicle Sin Azúcar', sku: 'CHI-001', units: 134, revenue:   536_000 },
    ],
  },
};

// Stock estático (tiempo real, no depende del período)
const stockData = [
  { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     stock: 82 },
  { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    stock: 34 },
  { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         stock: 91 },
  { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  stock: 15 },
  { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', stock: 67 },
];

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
function stockTheme(pct: number) {
  if (pct <= 20) return { bar: 'bg-red-500',    text: 'text-red-600',    badge: 'bg-red-50 text-red-700 border-red-200',         label: 'Crítico' };
  if (pct <= 40) return { bar: 'bg-orange-500', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Bajo'    };
  if (pct <= 70) return { bar: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Medio'   };
  return           { bar: 'bg-green-500',  text: 'text-green-600',  badge: 'bg-green-50 text-green-700 border-green-200',   label: 'OK'      };
}

// ──────────────────────────────────────────────────────────────
// TOOLTIP PERSONALIZADO
// ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-muted font-medium mb-0.5">{label}</p>
      <p className="font-bold text-dark text-sm">{clp(payload[0].value)}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CHART: barras (Recharts)
// ──────────────────────────────────────────────────────────────
function SalesBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data.map(d => ({ ...d, isMax: d.value === max }))} margin={{ top: 10, right: 8, left: 8, bottom: 4 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4c6fd0" />
            <stop offset="100%" stopColor="#3157b2" />
          </linearGradient>
          <linearGradient id="barGradPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#203c84" />
            <stop offset="100%" stopColor="#16265f" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(49,87,178,0.06)', radius: 6 }} />
        <ReferenceLine y={max} stroke="#3157b2" strokeDasharray="4 4" strokeOpacity={0.3} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}
          fill="url(#barGrad)"
          label={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ──────────────────────────────────────────────────────────────
// CHART: área (Recharts) — mes y año
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function MetricasPage() {
  const user = useUser();
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

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

  const summary   = salesByPeriod[period];
  const machines  = [...machineRows[period]].sort((a, b) => b.sales - a.sales);
  const products  = productRows[period];
  const lowStock  = stockData.filter(m => m.stock <= 40);
  const totalSales = machines.reduce((s, m) => s + m.sales, 0);
  const meta       = chartMeta[period];

  const periodLabel: Record<Period, string> = { day: 'Hoy', month: 'Este mes', year: 'Este año' };

  const tabs: { id: Tab; label: string; icon: typeof Monitor }[] = [
    { id: 'resumen',   label: 'Resumen',   icon: LineChartIcon },
    { id: 'maquinas',  label: 'Máquinas',  icon: Monitor       },
    { id: 'productos', label: 'Productos', icon: ShoppingCart  },
    { id: 'stock',     label: 'Stock',     icon: Package       },
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
            {empresa.name}
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Datos ilustrativos
            </span>
          </span> as unknown as string
        }
        variant="gradient"
        actions={
          <div className="flex items-center gap-1 bg-white/15 rounded-lg p-1">
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
        }
      />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="flex px-4 sm:px-6 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
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
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ventas totales',   value: clp(summary.total),                    icon: ShoppingCart, color: 'text-blue-600',    bg: 'bg-blue-50',    delta: `+${summary.delta}%`     },
                { label: 'N° de ventas',     value: summary.count.toLocaleString('es-CL'), icon: BarChart2,    color: 'text-purple-600',  bg: 'bg-purple-50',  delta: `+${summary.delta - 3}%` },
                { label: 'Ticket promedio',  value: clp(summary.avgTicket),                icon: Activity,     color: 'text-emerald-600', bg: 'bg-emerald-50', delta: '+3%'                    },
                { label: 'Crecimiento',      value: `+${summary.delta}%`,                  icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', delta: 'vs período anterior'    },
              ].map(card => (
                <div key={card.label} className="card p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs text-muted mb-1 font-medium">{card.label}</p>
                      <p className="text-lg sm:text-xl font-bold text-dark truncate">{card.value}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${card.bg} flex-shrink-0`}>
                      <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                    <span>{card.delta}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── PROTAGONISTA: Gráfico de ventas vs tiempo ── */}
            <div className="card overflow-hidden">
              {/* Header del gráfico */}
              <div className="page-header-gradient px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {meta.title}
                  </h2>
                  <p className="text-white/65 text-xs mt-0.5">{meta.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/60 text-xs">Total {periodLabel[period]}</p>
                  <p className="text-2xl font-bold text-white leading-tight">{clpShort(summary.total)}</p>
                </div>
              </div>

              {/* Gráfico */}
              <div className="px-2 sm:px-4 pt-4 pb-2">
                {period === 'day'
                  ? <SalesBarChart  data={chartData[period]} />
                  : <SalesAreaChart data={chartData[period]} />
                }
              </div>

              {/* Insights */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                {meta.insights.map(ins => (
                  <div key={ins.label} className="p-4 text-center">
                    <p className="text-xs text-muted mb-1">{ins.label}</p>
                    <p className="text-sm sm:text-base font-bold text-dark">{ins.value}</p>
                    <p className="text-xs text-muted mt-0.5">{ins.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: MÁQUINAS
        ══════════════════════════════════════ */}
        {activeTab === 'maquinas' && (
          <>
            {/* Tabla de máquinas */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-dark">Ventas por máquina · {periodLabel[period]}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-muted border-b border-gray-100">
                      <th className="px-5 py-3 font-semibold text-xs">#</th>
                      <th className="px-5 py-3 font-semibold text-xs">Máquina</th>
                      <th className="px-5 py-3 font-semibold text-xs text-right">Ventas</th>
                      <th className="px-5 py-3 font-semibold text-xs text-right">N° ventas</th>
                      <th className="px-5 py-3 font-semibold text-xs text-right">% total</th>
                      <th className="px-5 py-3 font-semibold text-xs text-center">Estado</th>
                      <th className="px-5 py-3 font-semibold text-xs hidden lg:table-cell">Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m, i) => {
                      const pct = Math.round((m.sales / totalSales) * 100);
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3 text-muted font-bold text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-dark">{m.name}</p>
                            <p className="text-xs text-muted">{m.location}</p>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-dark">{clp(m.sales)}</td>
                          <td className="px-5 py-3 text-right text-dark">{m.count.toLocaleString('es-CL')}</td>
                          <td className="px-5 py-3 text-right font-semibold text-primary">{pct}%</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              m.status === 'online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {m.status === 'online' ? 'En línea' : 'Fuera de línea'}
                            </span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted w-7 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mejor / Peor rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Mayor rendimiento
                </h3>
                <div className="space-y-3">
                  {machines.slice(0, 3).map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted">{m.count.toLocaleString('es-CL')} ventas</p>
                      </div>
                      <p className="font-bold text-dark text-sm flex-shrink-0">{clpShort(m.sales)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2 mb-4">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Menor rendimiento
                </h3>
                <div className="space-y-3">
                  {[...machines].reverse().slice(0, 3).map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="w-6 h-6 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted">{m.count.toLocaleString('es-CL')} ventas</p>
                      </div>
                      <p className="font-bold text-dark text-sm flex-shrink-0">{clpShort(m.sales)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: PRODUCTOS
        ══════════════════════════════════════ */}
        {activeTab === 'productos' && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-dark">Ventas por producto · {periodLabel[period]}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Más vendidos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-dark">Más vendidos</span>
                </div>
                <div className="space-y-3">
                  {products.top.map((p, i) => {
                    const maxU = products.top[0].units || 1;
                    return (
                      <div key={p.sku}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted w-5 flex-shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark truncate">{p.name}</p>
                              <p className="text-xs text-muted">{p.sku} · {p.units} uds.</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-dark flex-shrink-0 ml-2">{clpShort(p.revenue)}</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 ml-7">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(p.units / maxU) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Menos vendidos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-bold text-dark">Menos vendidos</span>
                </div>
                <div className="space-y-3">
                  {products.bottom.map((p, i) => {
                    const maxRef = products.top[0].units || 1;
                    const w = Math.max((p.units / maxRef) * 100, p.units > 0 ? 3 : 0);
                    return (
                      <div key={p.sku}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted w-5 flex-shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark truncate">{p.name}</p>
                              <p className="text-xs text-muted">{p.sku} · {p.units} uds.</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-bold text-dark">{clpShort(p.revenue)}</p>
                            {p.units === 0 && <p className="text-xs text-red-500 font-semibold">Sin ventas</p>}
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 ml-7">
                          <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: STOCK
        ══════════════════════════════════════ */}
        {activeTab === 'stock' && (
          <>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-dark">Nivel de stock actual por máquina</h2>
                </div>
                <span className="text-xs text-muted">Tiempo real</span>
              </div>
              <div className="space-y-4">
                {stockData.map(m => {
                  const sc = stockTheme(m.stock);
                  return (
                    <div key={m.id} className="flex items-center gap-4">
                      <div className="w-40 flex-shrink-0">
                        <p className="text-sm font-semibold text-dark truncate">{m.name}</p>
                        <p className="text-xs text-muted truncate">{m.location}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${sc.bar}`} style={{ width: `${m.stock}%` }} />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${sc.text}`}>{m.stock}%</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${sc.badge} w-14 justify-center`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {lowStock.length > 0 && (
              <div className="card p-5 border-l-4 border-orange-400">
                <h2 className="text-sm font-semibold text-dark flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Máquinas con bajo stock
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                    {lowStock.length} afectada{lowStock.length > 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lowStock.map(m => {
                    const sc = stockTheme(m.stock);
                    return (
                      <div key={m.id} className={`p-4 rounded-xl border ${sc.badge}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{m.name}</p>
                            <p className="text-xs mt-0.5 opacity-75">{m.location}</p>
                          </div>
                          <span className={`text-2xl font-bold ${sc.text}`}>{m.stock}%</span>
                        </div>
                        <div className="mt-3 bg-white/50 rounded-full h-2">
                          <div className={`h-2 rounded-full ${sc.bar}`} style={{ width: `${m.stock}%` }} />
                        </div>
                        <p className="text-xs mt-2 font-semibold">
                          {m.stock <= 20 ? '⚠ Requiere reposición urgente' : 'Revisar stock próximamente'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </AppShell>
  );
}
