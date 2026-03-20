'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, TrendingUp, TrendingDown } from 'lucide-react';
import { aggregatePaymentsAction, machineRankingAction } from '@/lib/actions/payments';
import type { RankedMachine } from '@/lib/actions/payments';
import {
  clpShort, getPeriodRange, getGroupBy, mapGroupedData, sanitizeRanking,
  PERIOD_LABELS, type Period,
} from '@/lib/utils/metricsHelpers';
import { MiniChart } from '@/components/metrics/MetricsCharts';

interface MaquinasMetricsPanelProps {
  enterpriseId: number | null;
  period: Period;
}

type MachineStat = RankedMachine & { sparkline: { label: string; value: number }[] };

export default function MaquinasMetricsPanel({ enterpriseId, period }: MaquinasMetricsPanelProps) {
  const [rankingTop, setRankingTop]           = useState<RankedMachine[]>([]);
  const [rankingLow, setRankingLow]           = useState<RankedMachine[]>([]);
  const [loadingRanking, setLoadingRanking]   = useState(true);
  const [machineStats, setMachineStats]       = useState<MachineStat[]>([]);
  const [loadingSparklines, setLoadingSparklines] = useState(false);

  useEffect(() => {
    setLoadingRanking(true);
    const { start, end } = getPeriodRange(period);
    const base = enterpriseId != null ? { enterprise_id: enterpriseId } : {};
    machineRankingAction({ ...base, start_date: start, end_date: end, limit: 5 })
      .then(res => {
        if (res.success) {
          const { top, low } = sanitizeRanking(res.top_performers ?? [], res.low_performers ?? []);
          setRankingTop(top);
          setRankingLow(low);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [period, enterpriseId]);

  useEffect(() => {
    if (!rankingTop.length) { setMachineStats([]); return; }
    setLoadingSparklines(true);
    const { start, end } = getPeriodRange(period);
    const groupBy = getGroupBy(period);
    const base    = enterpriseId != null ? { enterprise_id: enterpriseId } : {};
    Promise.all(
      rankingTop.map(m =>
        aggregatePaymentsAction({ ...base, machine_id: m.id, start_date: start, end_date: end, group_by: groupBy, successful: true })
      )
    )
      .then(results => {
        setMachineStats(rankingTop.map((m, i) => ({
          ...m,
          sparkline: mapGroupedData(results[i]?.data, groupBy, period),
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingSparklines(false));
  }, [rankingTop, period, enterpriseId]);

  const grandTotal   = machineStats.reduce((s, m) => s + m.payments_amount, 0);
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div data-tour="machine-metrics" className="space-y-4">
      {/* Lista compacta */}
      <div data-tour="machine-list" className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-dark">Ventas por máquina · {PERIOD_LABELS[period]}</span>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
          {loadingRanking ? (
            skeletonRows.map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 animate-pulse">
                <div className="w-4 h-3 bg-gray-100 rounded shrink-0" />
                <div className="flex-1 space-y-1"><div className="h-3.5 w-32 bg-gray-100 rounded" /><div className="h-2.5 w-20 bg-gray-100 rounded" /></div>
                <div className="w-20 h-7 bg-gray-100 rounded shrink-0" />
                <div className="w-16 h-3.5 bg-gray-100 rounded shrink-0" />
              </div>
            ))
          ) : rankingTop.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-muted">Sin ventas en este período</p></div>
          ) : (
            (loadingSparklines ? rankingTop : machineStats).map((m, i) => {
              const sparkline = 'sparkline' in m ? (m as MachineStat).sparkline : [];
              const pct       = grandTotal > 0 ? Math.round((m.payments_amount / grandTotal) * 100) : 0;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <span className="text-xs font-bold text-gray-400 w-4 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/maquinas/${m.id}`} className="text-sm font-medium text-dark truncate hover:text-primary block leading-tight">{m.name}</Link>
                    <p className="text-xs text-muted">{m.payments_quantity.toLocaleString('es-CL')} ventas</p>
                  </div>
                  <div className="w-20 shrink-0">
                    {loadingSparklines
                      ? <div className="h-7 bg-gray-100 rounded animate-pulse" />
                      : <MiniChart data={sparkline} id={`mac-${m.id}`} compact />
                    }
                  </div>
                  <div className="text-right shrink-0 min-w-[68px]">
                    <p className="text-sm font-bold text-dark">{clpShort(m.payments_amount)}</p>
                    <p className="text-xs text-muted">{pct}%</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mayor / Menor rendimiento */}
      <div data-tour="machine-ranking" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { label: 'Mayor rendimiento', icon: <TrendingUp   className="h-3.5 w-3.5 text-emerald-500" />, items: rankingTop.slice(0, 3), badge: 'bg-emerald-500', row: 'hover:bg-emerald-50/60' },
          { label: 'Menor rendimiento', icon: <TrendingDown className="h-3.5 w-3.5 text-red-400"     />, items: rankingLow.slice(0, 3), badge: 'bg-red-400',     row: 'hover:bg-red-50/60'     },
        ] as const).map(({ label, icon, items, badge, row }) => (
          <div key={label} className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {icon}
              <span className="text-sm font-semibold text-dark">{label}</span>
            </div>
            {loadingRanking ? (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                    <div className="w-5 h-5 bg-gray-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1"><div className="h-3.5 w-28 bg-gray-100 rounded" /><div className="h-2.5 w-16 bg-gray-100 rounded" /></div>
                    <div className="w-14 h-3.5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">Sin datos</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((m, i) => (
                  <Link key={m.id} href={`/maquinas/${m.id}`} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${row}`}>
                    <span className={`w-5 h-5 rounded-full ${badge} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{m.name}</p>
                      <p className="text-xs text-muted">{m.payments_quantity.toLocaleString('es-CL')} ventas</p>
                    </div>
                    <p className="text-sm font-bold text-dark shrink-0">{clpShort(m.payments_amount)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
