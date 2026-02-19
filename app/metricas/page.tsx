'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Package, Monitor, Building2,
  ShoppingCart, AlertTriangle, BarChart2, Activity,
  ArrowUpRight, Star, LineChart as LineChartIcon,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

// ──────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────
type Period = 'day' | 'month' | 'year';

// ──────────────────────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────────────────────
const empresa = { id: 1, name: 'Empresa Demo SPA' };

const salesByPeriod: Record<Period, { total: number; count: number; avgTicket: number; delta: number }> = {
  day:   { total: 1_280_000,   count: 43,     avgTicket: 29_767, delta: 12 },
  month: { total: 28_450_000,  count: 892,    avgTicket: 31_894, delta: 8  },
  year:  { total: 312_800_000, count: 10_234, avgTicket: 30_562, delta: 23 },
};

const machineRows = {
  day: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 398_000,   count: 14, stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 320_000,   count: 11, stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 260_000,   count: 9,  stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 192_000,   count: 6,  stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 110_000,   count: 3,  stock: 67 },
  ],
  month: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 8_900_000,  count: 287, stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 7_200_000,  count: 219, stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 5_800_000,  count: 178, stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 4_200_000,  count: 134, stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 2_350_000,  count: 74,  stock: 67 },
  ],
  year: [
    { id: 1, name: 'Mall Central',      location: 'Mall Central, Local 23',     status: 'online',  sales: 98_200_000,  count: 3_124, stock: 82 },
    { id: 2, name: 'Torre Norte',       location: 'Torre Costanera, Piso 5',    status: 'online',  sales: 79_400_000,  count: 2_413, stock: 34 },
    { id: 3, name: 'Campus Sur',        location: 'U. Sur, Edificio A',         status: 'online',  sales: 64_100_000,  count: 1_978, stock: 91 },
    { id: 4, name: 'Parque Industrial', location: 'Parque Industrial, Nave 3',  status: 'online',  sales: 46_500_000,  count: 1_489, stock: 15 },
    { id: 5, name: 'Laguna Center',     location: 'Laguna Center, Planta Baja', status: 'offline', sales: 24_600_000,  count: 830,   stock: 67 },
  ],
};

const productRows = {
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

const trendWeek = [
  { label: 'Lun', value: 145_000 },
  { label: 'Mar', value: 162_000 },
  { label: 'Mié', value: 178_000 },
  { label: 'Jue', value: 195_000 },
  { label: 'Vie', value: 225_000 },
  { label: 'Sáb', value: 248_000 },
  { label: 'Dom', value: 127_000 },
];

const trendMonths = [
  { label: 'Sep', value: 22_400_000 },
  { label: 'Oct', value: 19_800_000 },
  { label: 'Nov', value: 24_500_000 },
  { label: 'Dic', value: 31_200_000 },
  { label: 'Ene', value: 26_800_000 },
  { label: 'Feb', value: 28_450_000 },
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
  if (pct <= 20) return { bar: 'bg-red-500',    text: 'text-red-600',    badge: 'bg-red-50 text-red-700 border-red-200',       label: 'Crítico'   };
  if (pct <= 40) return { bar: 'bg-orange-500', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Bajo'      };
  if (pct <= 70) return { bar: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Medio'     };
  return           { bar: 'bg-green-500',  text: 'text-green-600',  badge: 'bg-green-50 text-green-700 border-green-200',   label: 'OK'        };
}

// ──────────────────────────────────────────────────────────────
// CHART: barras
// ──────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max   = Math.max(...data.map(d => d.value));
  const W = 560, H = 170, PAD = 28;
  const step  = (W - PAD * 2) / data.length;
  const barW  = step * 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H + 32}`} className="w-full">
      {data.map((d, i) => {
        const barH = ((d.value / max) * (H - PAD));
        const x    = PAD + i * step + (step - barW) / 2;
        const y    = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="#3157b2" rx={5} opacity={0.85} />
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={12} fill="#9ca3af">{d.label}</text>
            <text x={x + barW / 2} y={y - 7}  textAnchor="middle" fontSize={10} fill="#374151" fontWeight="600">{clpShort(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────
// CHART: línea
// ──────────────────────────────────────────────────────────────
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const max   = Math.max(...data.map(d => d.value));
  const min   = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const W = 560, H = 160, PAD = 28;

  const pts = data.map((d, i) => ({
    x: PAD + (i * (W - PAD * 2)) / (data.length - 1),
    y: PAD + ((max - d.value) / range) * (H - PAD * 2),
    label: d.label,
    value: d.value,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 32}`} className="w-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3157b2" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#3157b2" stopOpacity={0}    />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#3157b2" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill="#3157b2" stroke="white" strokeWidth={2} />
          <text x={p.x} y={H + 18} textAnchor="middle" fontSize={12} fill="#9ca3af">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ──────────────────────────────────────────────────────────────
function MetricasContent() {
  const user   = useUser();
  const [period, setPeriod] = useState<Period>('month');

  if (user?.role !== 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Sección exclusiva para clientes</h1>
            <p className="text-gray-500">Esta sección está disponible únicamente para usuarios con rol Cliente.</p>
          </div>
        </div>
      </div>
    );
  }

  const summary  = salesByPeriod[period];
  const machines = [...machineRows[period]].sort((a, b) => b.sales - a.sales);
  const products = productRows[period];
  const lowStock = machineRows.month.filter(m => m.stock <= 40);
  const totalSales = machines.reduce((s, m) => s + m.sales, 0);

  const periodLabel: Record<Period, string> = { day: 'Hoy', month: 'Este mes', year: 'Este año' };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ── */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
                <LineChartIcon className="h-6 w-6 text-[#3157b2]" />
                Métricas
              </h1>
              <p className="text-muted flex items-center gap-2 mt-0.5 text-sm">
                <Building2 className="h-4 w-4" />
                {empresa.name}
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Datos ilustrativos
                </span>
              </p>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-1 bg-white/15 rounded-lg p-1 self-start sm:self-auto">
              {(['day', 'month', 'year'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    period === p
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {periodLabel[p]}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-8">

          {/* ────────────────────────────────────────────────
              KPI SUMMARY
          ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ventas totales',    value: clp(summary.total),                icon: ShoppingCart, color: 'text-blue-600',    bg: 'bg-blue-50',    delta: `+${summary.delta}%`       },
              { label: 'Número de ventas',  value: summary.count.toLocaleString('es-CL'), icon: BarChart2,    color: 'text-purple-600',  bg: 'bg-purple-50',  delta: `+${summary.delta - 3}%`   },
              { label: 'Ticket promedio',   value: clp(summary.avgTicket),            icon: Activity,     color: 'text-emerald-600', bg: 'bg-emerald-50', delta: '+3%'                      },
              { label: 'Tendencia global',  value: 'Crecimiento',                     icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', delta: `+${summary.delta}%`       },
            ].map(card => (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-muted mb-1 font-medium">{card.label}</p>
                    <p className="text-xl font-bold text-dark truncate">{card.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm font-semibold text-emerald-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {card.delta}
                  <span className="text-muted font-normal ml-1.5 text-xs">vs período anterior</span>
                </div>
              </div>
            ))}
          </div>

          {/* ────────────────────────────────────────────────
              VENTAS POR EMPRESA
          ──────────────────────────────────────────────── */}
          <section className="card p-6">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-[#3157b2]" />
              Ventas totales por empresa
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <p className="text-sm text-muted font-medium">{empresa.name}</p>
                <p className="text-3xl font-bold text-dark mt-1">{clp(summary.total)}</p>
                <p className="text-sm text-muted mt-1">
                  {summary.count.toLocaleString('es-CL')} transacciones · {clp(summary.avgTicket)} ticket prom.
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                <TrendingUp className="h-6 w-6" />
                +{summary.delta}%
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────
              VENTAS + N° VENTAS POR MÁQUINA
          ──────────────────────────────────────────────── */}
          <section className="card p-6">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5 text-[#3157b2]" />
              Ventas y número de ventas por máquina
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-muted border-b border-gray-100">
                    <th className="pb-3 font-semibold">#</th>
                    <th className="pb-3 font-semibold">Máquina</th>
                    <th className="pb-3 font-semibold text-right">Ventas ($)</th>
                    <th className="pb-3 font-semibold text-right"># Ventas</th>
                    <th className="pb-3 font-semibold text-right">% del total</th>
                    <th className="pb-3 font-semibold text-center">Estado</th>
                    <th className="pb-3 font-semibold pl-4">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m, i) => {
                    const pct = Math.round((m.sales / totalSales) * 100);
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-muted font-bold">{i + 1}</td>
                        <td className="py-3">
                          <p className="font-semibold text-dark">{m.name}</p>
                          <p className="text-xs text-muted">{m.location}</p>
                        </td>
                        <td className="py-3 text-right font-bold text-dark">{clp(m.sales)}</td>
                        <td className="py-3 text-right text-dark">{m.count.toLocaleString('es-CL')}</td>
                        <td className="py-3 text-right font-semibold text-[#3157b2]">{pct}%</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            m.status === 'online'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {m.status === 'online' ? 'En línea' : 'Fuera de línea'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-[#3157b2] h-2 rounded-full" style={{ width: `${pct}%` }} />
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
          </section>

          {/* ────────────────────────────────────────────────
              VENTAS POR PRODUCTO (top / bottom)
          ──────────────────────────────────────────────── */}
          <section className="card p-6">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-5">
              <ShoppingCart className="h-5 w-5 text-[#3157b2]" />
              Ventas totales por producto
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Más vendidos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-dark">Productos más vendidos</span>
                </div>
                <div className="space-y-3">
                  {products.top.map((p, i) => {
                    const maxUnits = products.top[0].units || 1;
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
                          <p className="text-sm font-bold text-dark flex-shrink-0 ml-2">{clp(p.revenue)}</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 ml-7">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${(p.units / maxUnits) * 100}%` }}
                          />
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
                  <span className="text-sm font-bold text-dark">Productos menos vendidos</span>
                </div>
                <div className="space-y-3">
                  {products.bottom.map((p, i) => {
                    const maxRef = products.top[0].units || 1;
                    const widthPct = Math.max((p.units / maxRef) * 100, p.units > 0 ? 3 : 0);
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
                            <p className="text-sm font-bold text-dark">{clp(p.revenue)}</p>
                            {p.units === 0 && (
                              <p className="text-xs text-red-500 font-semibold">Sin ventas</p>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 ml-7">
                          <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* ────────────────────────────────────────────────
              STOCK POR MÁQUINA
          ──────────────────────────────────────────────── */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <Package className="h-5 w-5 text-[#3157b2]" />
                Nivel de stock actual por máquina
              </h2>
              <span className="text-xs text-muted">Promedio de slots</span>
            </div>
            <div className="space-y-4">
              {machineRows.month.map(m => {
                const sc = stockTheme(m.stock);
                return (
                  <div key={m.id} className="flex items-center gap-4">
                    <div className="w-44 flex-shrink-0">
                      <p className="text-sm font-semibold text-dark truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate">{m.location}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${sc.bar}`} style={{ width: `${m.stock}%` }} />
                      </div>
                      <span className={`text-sm font-bold w-10 text-right ${sc.text}`}>{m.stock}%</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${sc.badge} w-16 justify-center`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ────────────────────────────────────────────────
              MÁQUINAS CON BAJO STOCK
          ──────────────────────────────────────────────── */}
          {lowStock.length > 0 && (
            <section className="card p-6 border-l-4 border-orange-400">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Máquinas con bajo stock
                <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                  {lowStock.length} afectada{lowStock.length > 1 ? 's' : ''}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStock.map(m => {
                  const sc = stockTheme(m.stock);
                  return (
                    <div key={m.id} className={`p-4 rounded-xl border ${sc.badge}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-xs mt-0.5 opacity-80">{m.location}</p>
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
            </section>
          )}

          {/* ────────────────────────────────────────────────
              RENDIMIENTO DE MÁQUINAS
          ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mayor rendimiento */}
            <section className="card p-6">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Máquinas con mayor rendimiento
              </h2>
              <div className="space-y-3">
                {machines.slice(0, 3).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate">{m.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-dark text-sm">{clp(m.sales)}</p>
                      <p className="text-xs text-emerald-600 font-semibold">{m.count.toLocaleString('es-CL')} ventas</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Menor rendimiento */}
            <section className="card p-6">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Máquinas con menor rendimiento
              </h2>
              <div className="space-y-3">
                {[...machines].reverse().slice(0, 3).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="w-7 h-7 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate">{m.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-dark text-sm">{clp(m.sales)}</p>
                      <p className="text-xs text-red-500 font-semibold">{m.count.toLocaleString('es-CL')} ventas</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ────────────────────────────────────────────────
              TENDENCIA DE VENTAS
          ──────────────────────────────────────────────── */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#3157b2]" />
                Tendencia de ventas
              </h2>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                Crecimiento sostenido
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold text-muted mb-3">Últimos 7 días (diario)</p>
                <BarChart data={trendWeek} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted mb-3">Últimos 6 meses (mensual)</p>
                <LineChart data={trendMonths} />
              </div>
            </div>

            {/* Mini insight row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
              {[
                { label: 'Mejor día (semana)',  value: 'Sábado',   sub: clpShort(248_000) },
                { label: 'Mejor mes (6 meses)', value: 'Diciembre', sub: clpShort(31_200_000) },
                { label: 'Crecimiento MoM',     value: '+6.1%',    sub: 'Ene → Feb' },
              ].map(ins => (
                <div key={ins.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted mb-1">{ins.label}</p>
                  <p className="text-base font-bold text-dark">{ins.value}</p>
                  <p className="text-xs text-muted mt-0.5">{ins.sub}</p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default function MetricasPage() {
  return (
    <ProtectedRoute>
      <MetricasContent />
    </ProtectedRoute>
  );
}
