'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { aggregatePaymentsAction } from '@/lib/actions/payments';
import type { PaymentFilters } from '@/lib/interfaces/payment.interface';
import {
  getPeriodRange,
  getGroupBy,
  formatGroupDate,
  formatGroupDateFull,
  PERIOD_LABELS,
  type Period,
} from '@/lib/utils/metricsHelpers';

// ── Tooltip ───────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; payload?: { tooltipLabel?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const displayLabel = payload[0]?.payload?.tooltipLabel ?? label;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 font-medium mb-1">{displayLabel}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-600 capitalize">{entry.name}</span>
          <span className="font-bold text-gray-900 ml-1">{entry.value.toLocaleString('es-CL')}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="h-[180px] flex items-center justify-center">
      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Derivar parámetros cuando hay filtro de fecha manual ───────
function deriveFromDateRange(dateFrom: string, dateTo: string): {
  start_date: string;
  end_date: string;
  group_by: 'day' | 'month';
  period: Period;
} {
  const diffMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  const group_by = days > 60 ? 'month' : 'day';
  return {
    start_date: dateFrom,
    end_date: dateTo,
    group_by,
    period: group_by === 'month' ? 'year' : 'month',
  };
}

// ── Título dinámico ────────────────────────────────────────────
const PERIOD_TITLE: Record<Period, string> = {
  day:   'Últimos 7 días',
  month: 'Este mes',
  year:  'Este año',
};

interface ChartPoint {
  label: string;
  tooltipLabel: string;
  exitosos: number;
  fallidos: number;
}

interface PaymentsChartProps {
  filters: PaymentFilters;
}

export default function PaymentsChart({ filters }: PaymentsChartProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<ChartPoint[]>([]);
  const [totals, setTotals] = useState<{ exitosos: number; fallidos: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const hasManualDates = Boolean(filters.date_from || filters.date_to);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData([]);
    setTotals(null);

    let start_date: string;
    let end_date: string;
    let group_by: 'day' | 'month';
    let activePeriod: Period;

    if (hasManualDates && filters.date_from && filters.date_to) {
      const derived = deriveFromDateRange(filters.date_from, filters.date_to);
      ({ start_date, end_date, group_by, activePeriod } = { ...derived, activePeriod: derived.period });
    } else if (hasManualDates && filters.date_from) {
      const now = new Date().toISOString();
      const derived = deriveFromDateRange(filters.date_from, now);
      ({ start_date, end_date, group_by, activePeriod } = { ...derived, activePeriod: derived.period });
    } else {
      // Sin fechas manuales → usar período del selector
      const range = getPeriodRange(period);
      start_date = range.start;
      end_date = range.end;
      group_by = getGroupBy(period);
      activePeriod = period;
    }

    const base = {
      start_date,
      end_date,
      group_by,
      ...(filters.enterprise_id ? { enterprise_id: filters.enterprise_id } : {}),
      ...(filters.machine_id    ? { machine_id:    filters.machine_id    } : {}),
    };

    Promise.all([
      aggregatePaymentsAction({ ...base, successful: true  }),
      aggregatePaymentsAction({ ...base, successful: false }),
    ])
      .then(([okRes, failRes]) => {
        if (cancelled) return;

        const okPoints   = okRes.success   ? (okRes.data   ?? []) : [];
        const failPoints = failRes.success ? (failRes.data ?? []) : [];

        const dateMap = new Map<string, { exitosos: number; fallidos: number }>();
        for (const pt of okPoints) {
          dateMap.set(pt.date, { exitosos: pt.total_count, fallidos: 0 });
        }
        for (const pt of failPoints) {
          const existing = dateMap.get(pt.date);
          if (existing) {
            existing.fallidos = pt.total_count;
          } else {
            dateMap.set(pt.date, { exitosos: 0, fallidos: pt.total_count });
          }
        }

        const sorted = Array.from(dateMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, vals]) => ({
            label:        formatGroupDate(date, group_by, activePeriod),
            tooltipLabel: formatGroupDateFull(date, group_by, activePeriod),
            exitosos:     vals.exitosos,
            fallidos:     vals.fallidos,
          }));

        setData(sorted);
        setTotals({
          exitosos: okPoints.reduce((s, p) => s + p.total_count, 0),
          fallidos: failPoints.reduce((s, p) => s + p.total_count, 0),
        });
      })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.enterprise_id, filters.machine_id, filters.date_from, filters.date_to, period]);

  const hasData = data.some((d) => d.exitosos > 0 || d.fallidos > 0);
  const chartTitle = hasManualDates ? 'Período personalizado' : PERIOD_TITLE[period];

  return (
    <div className="card mb-4 overflow-hidden">
      {/* Header con gradiente, igual al dashboard */}
      <div className="page-header-gradient px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white">Transacciones · {chartTitle}</h3>
          <p className="text-white/60 text-xs mt-0.5">Exitosas vs fallidas en el período</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Totales */}
          {loading ? (
            <div className="flex gap-3">
              {[56, 48].map((w, i) => (
                <div key={i} className="h-4 rounded bg-white/20 animate-pulse" style={{ width: w }} />
              ))}
            </div>
          ) : totals ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white">{totals.exitosos.toLocaleString('es-CL')}</span>
                <span className="text-white/60">exitosas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                <span className="font-bold text-white">{totals.fallidos.toLocaleString('es-CL')}</span>
                <span className="text-white/60">fallidas</span>
              </span>
            </div>
          ) : null}

          {/* Selector de período — solo cuando no hay fechas manuales */}
          {!hasManualDates && (
            <div className="flex items-center gap-1 rounded-lg p-1 bg-white/15">
              {(['day', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    period === p
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="px-2 pt-4 pb-2">
        {loading ? (
          <ChartSkeleton />
        ) : !hasData ? (
          <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
            Sin datos para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#d1d5db' }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1.5 }} />
              <Line
                type="monotone"
                dataKey="exitosos"
                name="exitosos"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="fallidos"
                name="fallidos"
                stroke="#f87171"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#f87171', stroke: 'white', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
