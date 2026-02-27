'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Package, Calendar, Building2, Edit,
  BarChart2, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useProductStore } from '@/lib/stores/productStore';
import { getEnterpriseAction } from '@/lib/actions/enterprise';
import { aggregatePaymentsAction } from '@/lib/actions/payments';
import { AppShell, PageHeader } from '@/components/ui-custom';
import Link from 'next/link';

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
      start:     toIso(new Date(Date.UTC(y, m, d,      0,  0,  0))),
      end:       toIso(new Date(Date.UTC(y, m, d,     23, 59, 59))),
      prevStart: toIso(new Date(Date.UTC(y, m, d - 1,  0,  0,  0))),
      prevEnd:   toIso(new Date(Date.UTC(y, m, d - 1, 23, 59, 59))),
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

  if (period === 'day') {
    return Array.from({ length: 13 }, (_, i) => {
      const hour = i + 8;
      return {
        label: `${hour}h`,
        start: toIso(new Date(Date.UTC(y, m, now.getUTCDate(), hour,  0,  0))),
        end:   toIso(new Date(Date.UTC(y, m, now.getUTCDate(), hour, 59, 59))),
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
export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const {
    selectedProduct: product,
    isLoadingProduct: isLoading,
    productError: error,
    fetchProduct,
    clearProductError,
    clearSelectedProduct,
  } = useProductStore();

  const [enterpriseName, setEnterpriseName] = useState<string | null>(null);

  // Métricas
  const [period, setPeriod]         = useState<Period>('month');
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; value: number }[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!productId) return;
    clearSelectedProduct();
    clearProductError();
    fetchProduct(productId);
  }, [productId, fetchProduct, clearSelectedProduct, clearProductError]);

  useEffect(() => {
    return () => { clearSelectedProduct(); clearProductError(); };
  }, [clearSelectedProduct, clearProductError]);

  useEffect(() => {
    if (!product?.enterprise_id) return;
    getEnterpriseAction(product.enterprise_id).then((res) => {
      if (res.success && res.enterprise) setEnterpriseName(res.enterprise.name);
    });
  }, [product?.enterprise_id]);

  // Carga métricas cuando cambia el período o se carga el producto
  useEffect(() => {
    if (!productId) return;
    setLoadingMetrics(true);
    setAggCurrent(null);
    setAggPrev(null);
    setChartData([]);

    const id = Number(productId);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const intervals = generateIntervals(period);

    Promise.all([
      aggregatePaymentsAction({ product_id: id, start_date: start,     end_date: end     }),
      aggregatePaymentsAction({ product_id: id, start_date: prevStart, end_date: prevEnd }),
      ...intervals.map(iv =>
        aggregatePaymentsAction({ product_id: id, start_date: iv.start, end_date: iv.end })
      ),
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
  }, [productId, period]);

  // ── KPIs calculados ────────────────────────────────────────────────────────
  const totalAmount = aggCurrent?.total_amount ?? 0;
  const totalCount  = aggCurrent?.total_count  ?? 0;
  const avgTicket   = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const growthPct   = (aggCurrent && aggPrev && aggPrev.total_amount > 0)
    ? Math.round(((aggCurrent.total_amount - aggPrev.total_amount) / aggPrev.total_amount) * 100)
    : null;

  const periodLabel: Record<Period, string> = { day: 'Hoy', month: 'Este mes', year: 'Este año' };

  // ── Estados de carga/error ────────────────────────────────────────────────
  if (isLoading || (!product && !error)) {
    return (
      <AppShell>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted">Cargando detalles del producto...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !product) {
    return (
      <AppShell>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark mb-2">
              {error ? 'Error al cargar producto' : 'Producto no encontrado'}
            </h3>
            <p className="text-muted mb-4">
              {error ?? 'El producto solicitado no existe o no tienes permisos para verlo.'}
            </p>
            <Link href="/productos" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon={Package}
        title={product.name}
        subtitle="Información y métricas del producto"
        backHref="/productos"
        variant="white"
        actions={
          <Link
            href={`/productos/${productId}/editar`}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-sm font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Link>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── MÉTRICAS DE VENTAS ── */}
          <div className="card overflow-hidden">
            {/* Header con selector de período */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-dark">Métricas de ventas</h3>
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
                <p className="text-xs text-muted mb-1">Ingresos</p>
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
                <p className="text-xs text-muted mb-1">Precio promedio</p>
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
              ) : period === 'day' ? (
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 4 }} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="prodBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4c6fd0" />
                        <stop offset="100%" stopColor="#3157b2" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={48} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(49,87,178,0.06)', radius: 6 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#prodBarGrad)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="prodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3157b2" stopOpacity={0.25} />
                        <stop offset="90%" stopColor="#3157b2" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={48} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3157b2', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="value" stroke="#3157b2" strokeWidth={2.5}
                      fill="url(#prodAreaGrad)" dot={false}
                      activeDot={{ r: 5, fill: '#3157b2', stroke: 'white', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── INFORMACIÓN DEL PRODUCTO ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Información del Producto
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-dark">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Producto</label>
                  <p className="text-dark font-mono">{product.id}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Empresa
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
                  {enterpriseName
                    ? <p className="text-dark">{enterpriseName}</p>
                    : <p className="text-muted text-sm">Cargando...</p>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* ── FECHAS ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Información de Registro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                <p className="text-dark">
                  {product.created_at ? new Date(product.created_at).toLocaleString('es-ES') : 'No disponible'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                <p className="text-dark">
                  {product.updated_at ? new Date(product.updated_at).toLocaleString('es-ES') : 'No disponible'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </AppShell>
  );
}
