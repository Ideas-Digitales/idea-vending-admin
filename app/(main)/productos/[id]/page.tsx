'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Package, Calendar, Building2, Edit,
  BarChart2, TrendingUp, TrendingDown,
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

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="card p-5">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-44 w-full rounded-2xl border border-gray-200 object-cover"
              />
            ) : (
              <div className="h-44 w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                <Package className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* ── MÉTRICAS DE VENTAS ── */}
          <div className="card overflow-hidden">
            {/* Header con selector de período y tipo de serie */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-dark">Métricas de ventas</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Per-series type toggles */}
                <div className="flex items-center gap-3">
                  {([
                    { label: 'Monto',    color: 'bg-blue-400',    current: amountType, set: setAmountType },
                    { label: 'Ventas',   color: 'bg-emerald-400', current: countType,  set: setCountType  },
                  ] as { label: string; color: string; current: SeriesType; set: (v: SeriesType) => void }[]).map(({ label, color, current, set }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                      <span className="text-xs text-gray-500">{label}</span>
                      <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                        <button
                          onClick={() => set('line')}
                          title="Línea"
                          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${current === 'line' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >〜</button>
                        <button
                          onClick={() => set('bar')}
                          title="Barras"
                          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${current === 'bar' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >▌</button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Period toggle */}
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
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 min-w-0">
              {/* Ingresos */}
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
              {/* Ventas */}
              <div className="px-5 py-4">
                <p className="text-xs text-muted mb-1">Ventas</p>
                {loadingMetrics
                  ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                  : <p className="text-xl font-bold text-dark truncate">{totalCount.toLocaleString('es-CL')}</p>
                }
                <p className="text-xs text-muted mt-0.5">transacciones</p>
              </div>
              {/* Ticket promedio */}
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

          {/* ── INFORMACIÓN DEL PRODUCTO ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
    </>
  );
}
