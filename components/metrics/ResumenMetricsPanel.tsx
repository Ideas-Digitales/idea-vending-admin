'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart, BarChart2, Activity, ArrowUpRight } from 'lucide-react';
import { aggregatePaymentsAction } from '@/lib/actions/payments';
import {
  clp, clpShort, getPeriodRange, getGroupBy, mapGroupedData, computeInsights,
  PERIOD_LABELS, type Period,
} from '@/lib/utils/metricsHelpers';
import { SalesDualAreaChart, KpiSkeleton } from '@/components/metrics/MetricsCharts';
import { HelpTooltip } from '@/components/help/HelpTooltip';

interface ResumenMetricsPanelProps {
  enterpriseId: number | null;
  period: Period;
}

const CHART_TITLE: Record<Period, { title: string; subtitle: string }> = {
  day:   { title: 'Ventas por día · Últimos 7 días', subtitle: 'Distribución diaria de ingresos de los últimos 7 días' },
  month: { title: 'Ventas por día · Este mes',       subtitle: 'Distribución diaria de ingresos del mes actual'        },
  year:  { title: 'Ventas por mes · Este año',       subtitle: 'Tendencia mensual de ingresos del año en curso'        },
};

export default function ResumenMetricsPanel({ enterpriseId, period }: ResumenMetricsPanelProps) {
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; tooltipLabel: string; exitosos: number; fallidos: number }[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    setAggCurrent(null);
    setAggPrev(null);
    setChartData([]);

    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const groupBy = getGroupBy(period);
    const base    = enterpriseId != null ? { enterprise_id: enterpriseId } : {};

    Promise.all([
      aggregatePaymentsAction({ ...base, start_date: start,     end_date: end,     successful: true }),
      aggregatePaymentsAction({ ...base, start_date: prevStart, end_date: prevEnd, successful: true }),
      aggregatePaymentsAction({ ...base, start_date: start,     end_date: end,     group_by: groupBy, successful: true  }),
      aggregatePaymentsAction({ ...base, start_date: start,     end_date: end,     group_by: groupBy, successful: false }),
    ])
      .then(([curr, prev, chartOk, chartFail]) => {
        if (curr?.success && curr.total_amount !== undefined)
          setAggCurrent({ total_amount: curr.total_amount, total_count: curr.total_count ?? 0 });
        if (prev?.success && prev.total_amount !== undefined)
          setAggPrev({ total_amount: prev.total_amount, total_count: prev.total_count ?? 0 });

        const okPoints   = mapGroupedData(chartOk?.success   ? chartOk.data   : undefined, groupBy, period);
        const failPoints = mapGroupedData(chartFail?.success ? chartFail.data : undefined, groupBy, period);

        setChartData(okPoints.map((p, i) => ({
          label:        p.label,
          tooltipLabel: p.tooltipLabel,
          exitosos:     p.value,
          fallidos:     failPoints[i]?.value ?? 0,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, enterpriseId]);

  const totalAmount   = aggCurrent?.total_amount ?? 0;
  const totalCount    = aggCurrent?.total_count  ?? 0;
  const avgTicket     = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const growthPct     = (aggCurrent && aggPrev && aggPrev.total_amount > 0)
    ? Math.round(((aggCurrent.total_amount - aggPrev.total_amount) / aggPrev.total_amount) * 100)
    : null;
  const growthPositive  = (growthPct ?? 0) >= 0;
  const growthAvailable = growthPct !== null;
  const insightsData    = chartData.map(d => ({ label: d.label, value: d.exitosos }));
  const insights        = computeInsights(period, insightsData);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div data-tour="kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted mb-1 font-medium">Ventas totales</p>
              {loading ? <KpiSkeleton /> : <p className="text-lg sm:text-xl font-bold text-dark truncate">{clp(totalAmount)}</p>}
            </div>
            <div className="p-2 rounded-xl bg-blue-50 flex-shrink-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
            <span>{PERIOD_LABELS[period]}</span>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted mb-1 font-medium">N° de ventas</p>
              {loading ? <KpiSkeleton /> : <p className="text-lg sm:text-xl font-bold text-dark truncate">{totalCount.toLocaleString('es-CL')}</p>}
            </div>
            <div className="p-2 rounded-xl bg-purple-50 flex-shrink-0">
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
            <span>{PERIOD_LABELS[period]}</span>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted mb-1 font-medium flex items-center gap-1">
                Ticket promedio
                <HelpTooltip text="Monto promedio por transacción: ventas totales ÷ número de ventas." side="bottom" />
              </p>
              {loading ? <KpiSkeleton /> : <p className="text-lg sm:text-xl font-bold text-dark truncate">{clp(avgTicket)}</p>}
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

        <div className={`card p-4 sm:p-5 transition-opacity ${!loading && !growthAvailable ? 'opacity-40' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted mb-1 font-medium flex items-center gap-1">
                Crecimiento
                <HelpTooltip text="Variación porcentual vs el período anterior equivalente." side="bottom" />
              </p>
              {loading ? <KpiSkeleton /> : growthAvailable
                ? <p className={`text-lg sm:text-xl font-bold truncate ${growthPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {growthPositive ? '+' : ''}{growthPct}%
                  </p>
                : <p className="text-lg sm:text-xl font-bold text-gray-400">—</p>
              }
            </div>
            <div className={`p-2 rounded-xl flex-shrink-0 ${growthAvailable && !growthPositive ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {growthAvailable && !growthPositive
                ? <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                : <TrendingUp   className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              }
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-muted">
            <span>{growthAvailable ? 'vs período anterior' : 'sin datos anteriores'}</span>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div data-tour="sales-chart" className="card overflow-hidden">
        <div className="page-header-gradient px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {CHART_TITLE[period].title}
            </h2>
            <p className="text-white/65 text-xs mt-0.5">{CHART_TITLE[period].subtitle}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/60 text-xs">Total {PERIOD_LABELS[period]}</p>
            {loading
              ? <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse mt-0.5" />
              : <p className="text-2xl font-bold text-white leading-tight">{clpShort(totalAmount)}</p>
            }
          </div>
        </div>

        <div className="px-2 sm:px-4 pt-4 pb-2">
          {loading
            ? <div className="h-[240px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted">Cargando datos...</p>
                </div>
              </div>
            : <SalesDualAreaChart data={chartData} />
          }
        </div>
        <div className="flex items-center justify-end gap-4 px-5 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-primary inline-block" />
            <span className="text-xs text-muted">Exitosos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-red-400 inline-block" />
            <span className="text-xs text-muted">Fallidos</span>
          </div>
        </div>

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
    </div>
  );
}
