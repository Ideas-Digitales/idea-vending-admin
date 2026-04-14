'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Package, Calendar, Building2, Edit,
  BarChart2, TrendingUp, TrendingDown,
  Hash, Clock, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import { SalesDualAxisChart, type SeriesType } from '@/components/metrics/MetricsCharts';
import { useProductStore } from '@/lib/stores/productStore';
import { getEnterpriseAction } from '@/lib/actions/enterprise';
import { aggregatePaymentsAction } from '@/lib/actions/payments';
import { PageHeader } from '@/components/ui-custom';
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

  if (period === 'day') {
    const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.UTC(y, m, now.getUTCDate() - 6 + i));
      return {
        label: DAY_SHORT[date.getUTCDay()],
        start: toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  0,  0,  0))),
        end:   toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59))),
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Métricas
  const [period, setPeriod]         = useState<Period>('month');
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; amount: number; count: number }[]>([]);
  const [amountType, setAmountType] = useState<SeriesType>('line');
  const [countType,  setCountType]  = useState<SeriesType>('line');
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
      aggregatePaymentsAction({ product_id: id, start_date: start,     end_date: end,     successful: true }),
      aggregatePaymentsAction({ product_id: id, start_date: prevStart, end_date: prevEnd, successful: true }),
      ...intervals.map(iv =>
        aggregatePaymentsAction({ product_id: id, start_date: iv.start, end_date: iv.end, successful: true })
      ),
    ]).then(([curr, prev, ...ivResults]) => {
      if (curr.success)  setAggCurrent({ total_amount: curr.total_amount ?? 0, total_count: curr.total_count ?? 0 });
      if (prev.success)  setAggPrev({ total_amount: prev.total_amount ?? 0, total_count: prev.total_count ?? 0 });
      setChartData(intervals.map((iv, i) => ({
        label:  iv.label,
        amount: ivResults[i]?.success ? (ivResults[i].total_amount ?? 0) : 0,
        count:  ivResults[i]?.success ? (ivResults[i].total_count  ?? 0) : 0,
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

  const periodLabel: Record<Period, string> = { day: '7 días', month: 'Este mes', year: 'Este año' };

  // ── Estados de carga/error ────────────────────────────────────────────────
  if (isLoading || (!product && !error)) {
    return (
      <>
        <PageHeader icon={Package} title="Detalles del Producto" backHref="/productos" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted">Cargando detalles del producto...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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

      <main className="flex-1 overflow-auto">
        <div className="flex items-start">
          <div className="flex-1 min-w-0 px-3 pt-3 pb-6">
            <div className="space-y-4">

            {/* ── MÉTRICAS DE VENTAS ── */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-dark">Métricas de ventas</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    {([
                      { label: 'Monto',  color: 'bg-blue-400',    current: amountType, set: setAmountType },
                      { label: 'Ventas', color: 'bg-emerald-400', current: countType,  set: setCountType  },
                    ] as { label: string; color: string; current: SeriesType; set: (v: SeriesType) => void }[]).map(({ label, color, current, set }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                        <span className="text-xs text-gray-500">{label}</span>
                        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                          <button onClick={() => set('line')} title="Línea"
                            className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${current === 'line' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >〜</button>
                          <button onClick={() => set('bar')} title="Barras"
                            className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${current === 'bar' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >▌</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['day', 'month', 'year'] as Period[]).map(p => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${period === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {periodLabel[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="px-5 py-4">
                  <p className="text-xs text-muted mb-1">Ingresos</p>
                  {loadingMetrics
                    ? <div className="h-7 w-28 bg-gray-100 rounded animate-pulse" />
                    : <p className="text-xl font-bold text-dark truncate">{clp(totalAmount)}</p>
                  }
                  {!loadingMetrics && growthPct !== null && (
                    <p className={`text-xs font-semibold mt-0.5 flex items-center gap-0.5 ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {growthPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {growthPct >= 0 ? '+' : ''}{growthPct}% vs período anterior
                    </p>
                  )}
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-muted mb-1">Ventas</p>
                  {loadingMetrics
                    ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                    : <p className="text-xl font-bold text-dark truncate">{totalCount.toLocaleString('es-CL')}</p>
                  }
                  <p className="text-xs text-muted mt-0.5">transacciones</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-muted mb-1">Precio promedio</p>
                  {loadingMetrics
                    ? <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
                    : <p className="text-xl font-bold text-dark truncate">{clp(avgTicket)}</p>
                  }
                  <p className="text-xs text-muted mt-0.5">por venta</p>
                </div>
              </div>

              {/* Gráfico */}
              <div className="px-4 pb-4">
                {loadingMetrics ? (
                  <div className="h-60 bg-gray-50 rounded-xl animate-pulse" />
                ) : chartData.every(d => d.amount === 0 && d.count === 0) ? (
                  <div className="h-60 flex items-center justify-center text-sm text-muted bg-gray-50 rounded-xl">
                    Sin ventas en este período
                  </div>
                ) : (
                  <SalesDualAxisChart data={chartData} amountType={amountType} countType={countType} />
                )}
              </div>
            </div>

            {/* ── BENTO: info visible solo en mobile (en desktop está en el sidebar) ── */}
            <div className="lg:hidden grid grid-cols-2 gap-3">
              <div className="card p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Hash className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted mb-0.5">ID</p>
                  <p className="text-sm font-mono font-semibold text-dark truncate">#{product.id}</p>
                </div>
              </div>
              <div className="card p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted mb-0.5">Empresa</p>
                  <p className="text-sm font-semibold text-dark truncate">{enterpriseName ?? '...'}</p>
                </div>
              </div>
              <div className="card p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted mb-0.5">Creado</p>
                  <p className="text-xs font-medium text-dark">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString('es-CL', { dateStyle: 'medium' }) : '—'}
                  </p>
                </div>
              </div>
              <div className="card p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted mb-0.5">Actualizado</p>
                  <p className="text-xs font-medium text-dark">
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString('es-CL', { dateStyle: 'medium' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

          {/* ══════════════════════════════════════════════════════════════════
              Sidebar derecho: imagen + info del producto (solo desktop)
          ══════════════════════════════════════════════════════════════════ */}
        <aside className={`hidden lg:flex flex-col bg-white border border-gray-200 rounded-2xl shrink-0 relative transition-all duration-300 ease-in-out overflow-hidden my-3 mr-3 shadow-md sticky top-3 self-start max-h-[calc(100vh-5rem)] ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>

          {sidebarCollapsed ? (
            /* ── Colapsado ── */
            <div className="relative flex flex-col items-center h-full min-h-[220px]">
              {/* Fondo: imagen desenfocada o gradiente */}
              {product.image ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img src={product.image} alt="" className="w-full h-full object-cover scale-150 blur-md" />
                  <div className="absolute inset-0 bg-[#3157b2]/60" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#3157b2]/70 to-[#3157b2]/90" />
              )}
              {/* Toggle */}
              <button
                onClick={() => setSidebarCollapsed(v => !v)}
                title="Expandir panel"
                className="relative z-10 mt-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 shadow-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1" />
              {/* Thumbnail anclado abajo */}
              {product.image && (
                <div className="relative z-10 mb-3">
                  <div className="w-9 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Expandido ── */
            <div className="flex-1 overflow-y-auto">

              {/* Imagen del producto — full width, sin padding */}
              <div className="relative">
                {product.image ? (
                  <div className="aspect-[3/4] w-full">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-gray-50 to-gray-100">
                    <Package className="h-10 w-10 text-gray-200" />
                    <span className="text-xs text-gray-400">Sin imagen</span>
                  </div>
                )}
                {/* Toggle — overlay top-left */}
                <button
                  onClick={() => setSidebarCollapsed(v => !v)}
                  title="Colapsar panel"
                  className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white transition-all"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Nombre */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Producto</p>
                <h2 className="text-sm font-bold text-dark leading-snug break-words">{product.name}</h2>
              </div>

              {/* Info bento */}
              <div className="p-3 space-y-2">

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Hash className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted font-medium">ID interno</p>
                    <p className="text-xs font-mono font-semibold text-dark">#{product.id}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted font-medium">Empresa</p>
                    <p className="text-xs font-semibold text-dark break-words">
                      {enterpriseName ?? <span className="text-gray-400 font-normal italic">Cargando...</span>}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted font-medium">Creado</p>
                      <p className="text-xs font-medium text-dark">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString('es-CL', { dateStyle: 'medium' })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted font-medium">Actualizado</p>
                      <p className="text-xs font-medium text-dark">
                        {product.updated_at
                          ? new Date(product.updated_at).toLocaleDateString('es-CL', { dateStyle: 'medium' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Editar */}
              <div className="px-3 pb-4 mt-1">
                <Link
                  href={`/productos/${productId}/editar`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar producto
                </Link>
              </div>

            </div>
          )}
        </aside>

        </div>{/* flex items-start */}
      </main>
    </>
  );
}
